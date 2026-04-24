const { toUsuario, toUsuarioConPassword } = require('../models/usuario.model');

function createUsuarioRepository({ pool }) {
  return {
    async findAll() {
      const [rows] = await pool.query(
        'SELECT id_usuario, nombre, email, rol, niveles_educativos, ubicacion, telefono, mentor_bio, mentor_experiencia, mentor_link FROM usuarios ORDER BY id_usuario ASC'
      );
      return rows.map(toUsuario);
    },

    async findById(id) {
      const [rows] = await pool.query(
        'SELECT id_usuario, nombre, email, rol, niveles_educativos, ubicacion, telefono, mentor_bio, mentor_experiencia, mentor_link FROM usuarios WHERE id_usuario = ? LIMIT 1',
        [Number(id)]
      );
      return rows.length ? toUsuario(rows[0]) : null;
    },

    async findByEmail(email) {
      const [rows] = await pool.query(
        'SELECT id_usuario, nombre, email, password_hash, rol, niveles_educativos, ubicacion, telefono, mentor_bio, mentor_experiencia, mentor_link FROM usuarios WHERE email = ? LIMIT 1',
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

    async updateUser(
      id,
      { nombre, email, niveles_educativos, ubicacion, telefono, mentor_bio, mentor_experiencia, mentor_link, password_hash },
      executor = pool
    ) {
      const passwordSql = password_hash ? ', password_hash = ?' : '';
      const params = [
        nombre,
        email,
        niveles_educativos || null,
        ubicacion || null,
        telefono || null,
        mentor_bio || null,
        mentor_experiencia || null,
        mentor_link || null,
      ];
      if (password_hash) params.push(password_hash);
      params.push(Number(id));

      await executor.query(
        `
          UPDATE usuarios
          SET nombre = ?, email = ?, niveles_educativos = ?, ubicacion = ?, telefono = ?,
              mentor_bio = ?, mentor_experiencia = ?, mentor_link = ?${passwordSql}
          WHERE id_usuario = ?
        `,
        params
      );

      const [rows] = await executor.query(
        'SELECT id_usuario, nombre, email, rol, niveles_educativos, ubicacion, telefono, mentor_bio, mentor_experiencia, mentor_link FROM usuarios WHERE id_usuario = ? LIMIT 1',
        [Number(id)]
      );
      return rows.length ? toUsuario(rows[0]) : null;
    },
  };
}

module.exports = {
  createUsuarioRepository,
};
