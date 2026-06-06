const { mapearSeguimiento } = require('../models/seguimiento.model');

function crearRepositorioSeguimiento({ pool }) {
  return {
    async buscarTodos() {
      const [rows] = await pool.query(
        `
          SELECT id_seguimiento, id_inscripcion, notas, fecha_seguimiento
          FROM seguimientos
          ORDER BY fecha_seguimiento ASC, id_seguimiento ASC
        `
      );

      return rows.map(mapearSeguimiento);
    },

    async buscarPorInscripcion(id_inscripcion) {
      const [rows] = await pool.query(
        `
          SELECT id_seguimiento, id_inscripcion, notas, fecha_seguimiento
          FROM seguimientos
          WHERE id_inscripcion = ?
          ORDER BY fecha_seguimiento ASC, id_seguimiento ASC
        `,
        [Number(id_inscripcion)]
      );

      return rows.map(mapearSeguimiento);
    },

    async crear({ id_inscripcion, notas, fecha_seguimiento }) {
      const [result] = await pool.query(
        `
          INSERT INTO seguimientos (id_inscripcion, progreso, notas, fecha_seguimiento)
          VALUES (?, 0, ?, ?)
        `,
        [
          Number(id_inscripcion),
          notas,
          fecha_seguimiento || new Date(),
        ]
      );

      const [rows] = await pool.query(
        `
          SELECT id_seguimiento, id_inscripcion, notas, fecha_seguimiento
          FROM seguimientos
          WHERE id_seguimiento = ?
          LIMIT 1
        `,
        [result.insertId]
      );

      return rows.length ? mapearSeguimiento(rows[0]) : null;
    },
  };
}

module.exports = {
  crearRepositorioSeguimiento,
};
