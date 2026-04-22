const bcrypt = require('bcryptjs');

const { pool } = require('../config/db');
const materiaRepository = require('../repositories/materia.repository');
const mentorMateriaRepository = require('../repositories/mentor-materia.repository');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_LETTER_REGEX = /[A-Za-z]/;
const PASSWORD_NUMBER_REGEX = /\d/;
const EDUCATIONAL_LEVELS = new Set([
  'primaria',
  'secundaria',
  'terciario',
  'universitario',
  'posgrado',
  'adultos',
]);

function createAppError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function uniqueList(items) {
  const seen = new Set();
  const unique = [];

  for (const item of items) {
    const trimmed = String(item || '').trim();
    const key = trimmed
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }

  return unique;
}

function parseMentorSubjects(data) {
  const predefined = normalizeList(data?.materias);
  const custom = String(data?.otrasMaterias || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return uniqueList([...predefined, ...custom]);
}

function parseEducationalLevels(data) {
  return uniqueList(normalizeList(data?.nivelesEducativos)).filter((level) =>
    EDUCATIONAL_LEVELS.has(level)
  );
}

// Esta salida devuelve solo informacion util para el cliente
// y evita exponer campos sensibles como el password hash.
function buildUserResponse(user, extra = {}) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    nivelesEducativos: user.nivelesEducativos || [],
    ...extra,
  };
}

function createAuthService({ usuarioRepository }) {
  return {
    async register(data) {
      /**
       * El registro concentra reglas de negocio importantes:
       * validaciones, diferencias entre roles y asociacion de materias
       * para el caso particular de mentores.
       *
       * Ademas se usa una transaccion para que el alta del usuario y sus
       * relaciones academicas se confirmen juntas o no se guarden.
       */
      const nombre = String(data?.nombre || '').trim();
      const email = String(data?.email || '').trim().toLowerCase();
      const password = String(data?.password || '');
      const rol = data?.rol === 'mentor' ? 'mentor' : 'estudiante';
      const mentorSubjects = parseMentorSubjects(data);
      const nivelesEducativos = parseEducationalLevels(data);

      if (!nombre) {
        throw createAppError('Campo obligatorio: nombre', 'VALIDATION_ERROR');
      }
      if (!EMAIL_REGEX.test(email)) {
        throw createAppError('Email invalido.', 'VALIDATION_ERROR');
      }
      if (password.length < 8) {
        throw createAppError('La contrasena debe tener al menos 8 caracteres.', 'VALIDATION_ERROR');
      }
      if (!PASSWORD_LETTER_REGEX.test(password) || !PASSWORD_NUMBER_REGEX.test(password)) {
        throw createAppError('La contrasena debe contener letras y numeros.', 'VALIDATION_ERROR');
      }
      if (rol === 'estudiante' && nivelesEducativos.length === 0) {
        throw createAppError(
          'Debes seleccionar al menos un nivel educativo de interes si te registras como estudiante.',
          'VALIDATION_ERROR'
        );
      }
      if (rol === 'mentor' && mentorSubjects.length === 0) {
        throw createAppError('Debes indicar al menos una materia si te registras como mentor.', 'VALIDATION_ERROR');
      }
      if (rol === 'mentor' && nivelesEducativos.length === 0) {
        throw createAppError('Debes seleccionar al menos un nivel educativo para registrarte como mentor.', 'VALIDATION_ERROR');
      }

      const existingUser = await usuarioRepository.findByEmail(email);
      if (existingUser) {
        throw createAppError('Ya existe un usuario registrado con ese email.', 'DUPLICATE_USER');
      }

      const password_hash = await bcrypt.hash(password, 10);
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        const user = await usuarioRepository.createUser(
          {
            nombre,
            email,
            password_hash,
            rol,
            niveles_educativos: nivelesEducativos.length ? JSON.stringify(nivelesEducativos) : null,
          },
          connection
        );

        const materias = [];

        if (rol === 'mentor') {
          for (const subjectName of mentorSubjects) {
            const materia = await materiaRepository.findOrCreateByNombre(subjectName, connection);
            if (!materia) continue;

            await mentorMateriaRepository.create(
              {
                mentorId: user.id,
                materiaId: materia.id,
              },
              connection
            );

            materias.push(materia);
          }
        }

        await connection.commit();

        return buildUserResponse(user, {
          materias,
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },

    async login(data) {
      // El login autentica al usuario y recompone su contexto
      // devolviendo tambien materias si el rol es mentor.
      const email = String(data?.email || '').trim().toLowerCase();
      const password = String(data?.password || '');

      if (!EMAIL_REGEX.test(email)) {
        throw createAppError('Email invalido.', 'VALIDATION_ERROR');
      }
      if (!password) {
        throw createAppError('Campo obligatorio: password', 'VALIDATION_ERROR');
      }

      const user = await usuarioRepository.findByEmail(email);
      if (!user) {
        throw createAppError('Credenciales invalidas.', 'INVALID_CREDENTIALS');
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        throw createAppError('Credenciales invalidas.', 'INVALID_CREDENTIALS');
      }

      let materias = [];
      if (user.rol === 'mentor') {
        const links = await mentorMateriaRepository.findByMentorId(user.id);
        materias = links.map((item) => ({
          id: item.materiaId,
          nombre: item.materiaNombre,
          codigo: item.materiaCodigo,
        }));
      }

      return buildUserResponse(user, { materias });
    },
  };
}

module.exports = {
  createAuthService,
};
