const { toClase } = require('../models/clase.model');

function createClaseRepository({ pool }) {
  const baseSelect = `
    SELECT
      c.id_clase,
      c.titulo,
      c.descripcion,
      c.fecha,
      c.modalidad,
      c.id_mentor,
      c.id_materia,
      c.precio,
      c.ubicacion,
      u.nombre AS mentor_nombre,
      u.email AS mentor_email,
      m.nombre AS materia_nombre
    FROM clases c
    INNER JOIN usuarios u ON u.id_usuario = c.id_mentor
    LEFT JOIN materias m ON m.id_materia = c.id_materia
  `;

  return {
    async createClase({ titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion }) {
      const [result] = await pool.query(
        `
          INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion]
      );

      return this.findById(result.insertId);
    },

    async findAll() {
      const [rows] = await pool.query(`
        ${baseSelect}
        ORDER BY c.fecha ASC, c.id_clase ASC
      `);

      return rows.map(toClase);
    },

    async findById(id) {
      const [rows] = await pool.query(
        `
          ${baseSelect}
          WHERE c.id_clase = ?
          LIMIT 1
        `,
        [Number(id)]
      );

      return rows.length ? toClase(rows[0]) : null;
    },

    async findByMentor(id_mentor) {
      const [rows] = await pool.query(
        `
          ${baseSelect}
          WHERE c.id_mentor = ?
          ORDER BY c.fecha ASC, c.id_clase ASC
        `,
        [Number(id_mentor)]
      );

      return rows.map(toClase);
    },

    async updateClase(id, { titulo, descripcion, fecha, modalidad, id_materia, precio, ubicacion }) {
      await pool.query(
        `
          UPDATE clases
          SET titulo = ?, descripcion = ?, fecha = ?, modalidad = ?, id_materia = ?, precio = ?, ubicacion = ?
          WHERE id_clase = ?
        `,
        [titulo, descripcion, fecha, modalidad, id_materia, precio, ubicacion, Number(id)]
      );

      return this.findById(id);
    },

    async deleteClase(id) {
      const clase = await this.findById(id);
      if (!clase) return null;

      await pool.query('DELETE FROM clases WHERE id_clase = ?', [Number(id)]);
      return clase;
    },
  };
}

module.exports = {
  createClaseRepository,
};
