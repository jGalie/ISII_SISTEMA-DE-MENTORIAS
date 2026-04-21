const { toUsuario, toUsuarioConPassword } = require('../models/usuario.model');

function createUsuarioRepository({ pool }) {
  return {
    async findAll() {
      const [rows] = await pool.query(
        'SELECT id_usuario, nombre, email, rol, niveles_educativos FROM usuarios ORDER BY id_usuario ASC'
      );
      return rows.map(toUsuario);
    },

    async findById(id) {
      const [rows] = await pool.query(
        'SELECT id_usuario, nombre, email, rol, niveles_educativos FROM usuarios WHERE id_usuario = ? LIMIT 1',
        [Number(id)]
      );
      return rows.length ? toUsuario(rows[0]) : null;
    },

    async findByEmail(email) {
      const [rows] = await pool.query(
        'SELECT id_usuario, nombre, email, password_hash, rol, niveles_educativos FROM usuarios WHERE email = ? LIMIT 1',
        [email]
      );
      return rows.length ? toUsuarioConPassword(rows[0]) : null;
    },

    async createUser({ nombre, email, password_hash, rol, niveles_educativos }, executor = pool) {
      const [result] = await executor.query(
        `
          INSERT INTO usuarios (nombre, email, password_hash, rol, niveles_educativos)
          VALUES (?, ?, ?, ?, ?)
        `,
        [nombre, email, password_hash, rol, niveles_educativos || null]
      );

      return {
        id: result.insertId,
        nombre,
        email,
        rol,
        nivelesEducativos: niveles_educativos ? JSON.parse(niveles_educativos) : [],
      };
    },

    async create(data) {
      return this.createUser(data);
    },
  };
}

module.exports = {
  createUsuarioRepository,
};
