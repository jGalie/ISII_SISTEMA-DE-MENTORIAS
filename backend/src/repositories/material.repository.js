const { mapearMaterial } = require('../models/material.model');

function crearRepositorioMaterial({ pool }) {
  const selectMaterial = `
    SELECT id_material, id_clase, titulo, url, fecha_creacion
    FROM materiales
  `;

  return {
    async buscarPorClase(id_clase) {
      const [rows] = await pool.query(
        `
          ${selectMaterial}
          WHERE id_clase = ?
          ORDER BY fecha_creacion DESC, id_material DESC
        `,
        [Number(id_clase)]
      );

      return rows.map(mapearMaterial);
    },

    async crear({ id_clase, titulo, url }) {
      const [result] = await pool.query(
        `
          INSERT INTO materiales (id_clase, titulo, url)
          VALUES (?, ?, ?)
        `,
        [Number(id_clase), titulo, url]
      );

      const [rows] = await pool.query(
        `
          ${selectMaterial}
          WHERE id_material = ?
          LIMIT 1
        `,
        [result.insertId]
      );

      return rows.length ? mapearMaterial(rows[0]) : null;
    },
  };
}

module.exports = {
  crearRepositorioMaterial,
};
