const { pool: defaultPool } = require('../config/db');
const { mapearMentorMateria } = require('../models/mentor-materia.model');

function crearRepositorioMentorMateria({ pool = defaultPool } = {}) {
  const selectBase = `
    SELECT
      mm.id_mentor_materia,
      mm.id_mentor,
      mm.id_materia,
      m.nombre AS materia_nombre,
      m.codigo AS materia_codigo
    FROM mentor_materias mm
    INNER JOIN materias m ON m.id_materia = mm.id_materia
  `;

  return {
    async buscarTodos() {
      const [rows] = await pool.query(`
        ${selectBase}
        ORDER BY mm.id_mentor ASC, m.nombre ASC
      `);

      return rows.map(mapearMentorMateria);
    },

    async buscarPorMentor(id_mentor) {
      const [rows] = await pool.query(
        `
          ${selectBase}
          WHERE mm.id_mentor = ?
          ORDER BY m.nombre ASC, mm.id_mentor_materia ASC
        `,
        [Number(id_mentor)]
      );

      return rows.map(mapearMentorMateria);
    },

    async buscarAsociacion(id_mentor, id_materia, executor = pool) {
      const [rows] = await executor.query(
        `
          SELECT id_mentor_materia, id_mentor, id_materia
          FROM mentor_materias
          WHERE id_mentor = ? AND id_materia = ?
          LIMIT 1
        `,
        [Number(id_mentor), Number(id_materia)]
      );

      return rows.length ? mapearMentorMateria(rows[0]) : null;
    },

    async crear({ id_mentor, id_materia }, executor = pool) {
      await executor.query(
        `
          INSERT INTO mentor_materias (id_mentor, id_materia)
          VALUES (?, ?)
        `,
        [Number(id_mentor), Number(id_materia)]
      );

      const [rows] = await executor.query(
        `
          ${selectBase}
          WHERE mm.id_mentor = ? AND mm.id_materia = ?
          LIMIT 1
        `,
        [Number(id_mentor), Number(id_materia)]
      );

      return rows.length ? mapearMentorMateria(rows[0]) : null;
    },

    async eliminarPorMentor(id_mentor, executor = pool) {
      await executor.query('DELETE FROM mentor_materias WHERE id_mentor = ?', [Number(id_mentor)]);
    },
  };
}

const mentorMateriaRepository = crearRepositorioMentorMateria({ pool: defaultPool });

module.exports = {
  crearRepositorioMentorMateria,
  ...mentorMateriaRepository,
};
