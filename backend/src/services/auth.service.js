const bcrypt = require('bcryptjs');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_LETTER_REGEX = /[A-Za-z]/;
const PASSWORD_NUMBER_REGEX = /\d/;

function createAppError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function createAuthService({ usuarioRepository }) {
  return {
    async register(data) {
      const nombre = String(data?.nombre || '').trim();
      const email = String(data?.email || '').trim().toLowerCase();
      const password = String(data?.password || '');
      const rol = data?.rol === 'mentor' ? 'mentor' : 'estudiante';

      if (!nombre) {
        throw createAppError('Campo obligatorio: nombre', 'VALIDATION_ERROR');
      }
      if (!EMAIL_REGEX.test(email)) {
        throw createAppError('Email inválido.', 'VALIDATION_ERROR');
      }
      if (password.length < 8) {
        throw createAppError('La contraseña debe tener al menos 8 caracteres.', 'VALIDATION_ERROR');
      }
      if (!PASSWORD_LETTER_REGEX.test(password) || !PASSWORD_NUMBER_REGEX.test(password)) {
        throw createAppError('La contraseña debe contener letras y números.', 'VALIDATION_ERROR');
      }

      const existingUser = await usuarioRepository.findByEmail(email);
      if (existingUser) {
        throw createAppError('Ya existe un usuario registrado con ese email.', 'DUPLICATE_USER');
      }

      const password_hash = await bcrypt.hash(password, 10);
      return usuarioRepository.createUser({ nombre, email, password_hash, rol });
    },

    async login(data) {
      const email = String(data?.email || '').trim().toLowerCase();
      const password = String(data?.password || '');

      if (!EMAIL_REGEX.test(email)) {
        throw createAppError('Email inválido.', 'VALIDATION_ERROR');
      }
      if (!password) {
        throw createAppError('Campo obligatorio: password', 'VALIDATION_ERROR');
      }

      const user = await usuarioRepository.findByEmail(email);
      if (!user) {
        throw createAppError('Credenciales inválidas.', 'INVALID_CREDENTIALS');
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        throw createAppError('Credenciales inválidas.', 'INVALID_CREDENTIALS');
      }

      return {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      };
    },
  };
}

module.exports = {
  createAuthService,
};
