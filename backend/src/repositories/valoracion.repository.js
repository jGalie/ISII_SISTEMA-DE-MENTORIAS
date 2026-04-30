const { mapearValoracion } = require('../models/valoracion.model');

function crearRepositorioValoracion({ pool }) {
  const baseSelect = `
    SELECT
      v.id_valoracion,
      v.id_clase,
      v.id_estudiante,
      v.id_mentor,
      v.estrellas,
      v.comentario,
      v.fecha,
      u.nombre AS estudiante_nombre,
      c.titulo AS clase_titulo
    FROM valoraciones v
    INNER JOIN usuarios u ON u.id_usuario = v.id_estudiante
    INNER JOIN clases c ON c.id_clase = v.id_clase
  `;

  return {
    async crear({ id_clase, id_estudiante, id_mentor, estrellas, comentario }) {
      const [result] = await pool.query(
        `
          INSERT INTO valoraciones (id_clase, id_estudiante, id_mentor, estrellas, comentario)
          VALUES (?, ?, ?, ?, ?)
        `,
        [id_clase, id_estudiante, id_mentor, estrellas, comentario || null]
      );

      return this.buscarPorId(result.insertId);
    },

    async buscarPorId(id) {
      const [rows] = await pool.query(
        `
          ${baseSelect}
          WHERE v.id_valoracion = ?
          LIMIT 1
        `,
        [Number(id)]
      );

      return rows.length ? mapearValoracion(rows[0]) : null;
    },

    async buscarPorClase(id_clase) {
      const [rows] = await pool.query(
        `
          ${baseSelect}
          WHERE v.id_clase = ?
          ORDER BY v.fecha DESC
        `,
        [Number(id_clase)]
      );

      return rows.map(mapearValoracion);
    },

    async buscarPorMentor(id_mentor) {
      const [rows] = await pool.query(
        `
          ${baseSelect}
          WHERE v.id_mentor = ?
          ORDER BY v.fecha DESC
        `,
        [Number(id_mentor)]
      );

      return rows.map(mapearValoracion);
    },

    async promedioPorMentor(id_mentor) {
      const [rows] = await pool.query(
        `
          SELECT AVG(estrellas) AS promedio, COUNT(*) AS cantidad
          FROM valoraciones
          WHERE id_mentor = ?
        `,
        [Number(id_mentor)]
      );

      const row = rows[0] || {};
      return {
        promedio: row.promedio != null ? Number(row.promedio) : null,
        cantidad: Number(row.cantidad || 0),
      };
    },

    async existeDeEstudianteEnClase(id_estudiante, id_clase) {
      const [rows] = await pool.query(
        `
          SELECT 1
          FROM valoraciones
          WHERE id_estudiante = ? AND id_clase = ?
          LIMIT 1
        `,
        [Number(id_estudiante), Number(id_clase)]
      );

      return rows.length > 0;
    },
  };
}

module.exports = {
  crearRepositorioValoracion,
};
