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

function requireFields(body, fields) {
  for (const field of fields) {
    if (body[field] == null || String(body[field]).trim() === '') {
      throw new Error(`Campo obligatorio: ${field}`);
    }
  }
}

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
  return Array.from(new Set(items.map((item) => item.trim()))).filter(Boolean);
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

function buildProfileResponse(user, materias = []) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    ubicacion: user.ubicacion || '',
    telefono: user.telefono || '',
    mentorBio: user.mentorBio || '',
    mentorExperiencia: user.mentorExperiencia || '',
    mentorLink: user.mentorLink || '',
    nivelesEducativos: user.nivelesEducativos || [],
    materias,
  };
}

function createUsuarioService({ usuarioRepository }) {
  return {
    async listar() {
      return usuarioRepository.findAll();
    },

    async obtener(id) {
      const user = await usuarioRepository.findById(id);
      if (!user) {
        throw createAppError('Usuario no encontrado.', 'NOT_FOUND');
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

      return buildProfileResponse(user, materias);
    },

    async crear(body) {
      requireFields(body, ['nombre', 'email', 'password_hash']);
      const rol = body.rol === 'mentor' ? 'mentor' : 'estudiante';
      return usuarioRepository.create({
        nombre: String(body.nombre).trim(),
        email: String(body.email).trim().toLowerCase(),
        password_hash: body.password_hash,
        rol,
      });
    },

    async actualizar(id, body) {
      const actorId = Number(body?.actorId || body?.id);
      const targetId = Number(id);

      if (!targetId || !actorId || targetId !== actorId) {
        throw createAppError('No tienes permisos para editar este perfil.', 'FORBIDDEN');
      }

      const existingUser = await usuarioRepository.findById(targetId);
      if (!existingUser) {
        throw createAppError('Usuario no encontrado.', 'NOT_FOUND');
      }

      const nombre = String(body?.nombre || '').trim();
      const email = String(body?.email || '').trim().toLowerCase();
      const ubicacion = String(body?.ubicacion || '').trim();
      const telefono = String(body?.telefono || '').trim();
      const mentorBio = String(body?.mentorBio || '').trim();
      const mentorExperiencia = String(body?.mentorExperiencia || '').trim();
      const mentorLink = String(body?.mentorLink || '').trim();
      const passwordActual = String(body?.passwordActual || '');
      const nuevaPassword = String(body?.nuevaPassword || '');
      const nivelesEducativos = parseEducationalLevels(body);
      const mentorSubjects = parseMentorSubjects(body);

      if (!nombre) {
        throw createAppError('Campo obligatorio: nombre', 'VALIDATION_ERROR');
      }
      if (!EMAIL_REGEX.test(email)) {
        throw createAppError('Email invalido.', 'VALIDATION_ERROR');
      }
      if (existingUser.rol === 'mentor' && mentorSubjects.length === 0) {
        throw createAppError('Debes indicar al menos una materia para el mentor.', 'VALIDATION_ERROR');
      }
      if (existingUser.rol === 'mentor' && nivelesEducativos.length === 0) {
        throw createAppError('Debes seleccionar al menos un nivel educativo para el mentor.', 'VALIDATION_ERROR');
      }

      const duplicated = await usuarioRepository.findByEmail(email);
      if (duplicated && Number(duplicated.id) !== targetId) {
        throw createAppError('Ya existe un usuario registrado con ese email.', 'DUPLICATE_USER');
      }

      let password_hash = null;
      if (passwordActual || nuevaPassword) {
        if (!passwordActual) {
          throw createAppError('Debes indicar la contrasena actual.', 'VALIDATION_ERROR');
        }
        if (nuevaPassword.length < 8) {
          throw createAppError('La nueva contrasena debe tener al menos 8 caracteres.', 'VALIDATION_ERROR');
        }
        if (!PASSWORD_LETTER_REGEX.test(nuevaPassword) || !PASSWORD_NUMBER_REGEX.test(nuevaPassword)) {
          throw createAppError('La nueva contrasena debe contener letras y numeros.', 'VALIDATION_ERROR');
        }

        const userWithPassword = await usuarioRepository.findByEmail(existingUser.email);
        const passwordMatches = await bcrypt.compare(passwordActual, userWithPassword.password_hash);
        if (!passwordMatches) {
          throw createAppError('La contrasena actual no es correcta.', 'VALIDATION_ERROR');
        }

        password_hash = await bcrypt.hash(nuevaPassword, 10);
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const updatedUser = await usuarioRepository.updateUser(
          targetId,
          {
            nombre,
            email,
            ubicacion,
            telefono,
            mentor_bio: existingUser.rol === 'mentor' ? mentorBio : null,
            mentor_experiencia: existingUser.rol === 'mentor' ? mentorExperiencia : null,
            mentor_link: existingUser.rol === 'mentor' ? mentorLink : null,
            password_hash,
            niveles_educativos:
              existingUser.rol === 'mentor' ? JSON.stringify(nivelesEducativos) : null,
          },
          connection
        );

        let materias = [];

        if (existingUser.rol === 'mentor') {
          await mentorMateriaRepository.deleteByMentorId(targetId, connection);

          for (const subjectName of mentorSubjects) {
            const materia = await materiaRepository.findOrCreateByNombre(subjectName, connection);
            if (!materia) continue;

            await mentorMateriaRepository.create(
              { mentorId: targetId, materiaId: materia.id },
              connection
            );

            materias.push(materia);
          }
        }

        await connection.commit();
        return buildProfileResponse(updatedUser, materias);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
  };
}

module.exports = {
  createUsuarioService,
};
