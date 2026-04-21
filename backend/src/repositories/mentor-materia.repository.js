const { pool } = require('../config/db');
const { toMentorMateria } = require('../models/mentor-materia.model');

async function findAll() {
  const [rows] = await pool.query(`
    SELECT
      mm.id_mentor_materia,
      mm.id_mentor,
      mm.id_materia,
      m.nombre AS materia_nombre,
      m.codigo AS materia_codigo
    FROM mentor_materias mm
    INNER JOIN materias m ON m.id_materia = mm.id_materia
    ORDER BY mm.id_mentor ASC, m.nombre ASC
  `);

  return rows.map(toMentorMateria);
}

async function findByMentorId(mentorId) {
  const [rows] = await pool.query(
    `
      SELECT
        mm.id_mentor_materia,
        mm.id_mentor,
        mm.id_materia,
        m.nombre AS materia_nombre,
        m.codigo AS materia_codigo
      FROM mentor_materias mm
      INNER JOIN materias m ON m.id_materia = mm.id_materia
      WHERE mm.id_mentor = ?
      ORDER BY m.nombre ASC, mm.id_mentor_materia ASC
    `,
    [Number(mentorId)]
  );

  return rows.map(toMentorMateria);
}

async function exists(mentorId, materiaId, executor = pool) {
  const [rows] = await executor.query(
    `
      SELECT 1
      FROM mentor_materias
      WHERE id_mentor = ? AND id_materia = ?
      LIMIT 1
    `,
    [Number(mentorId), Number(materiaId)]
  );

  return rows.length > 0;
}

async function create({ mentorId, materiaId }, executor = pool) {
  await executor.query(
    `
      INSERT IGNORE INTO mentor_materias (id_mentor, id_materia)
      VALUES (?, ?)
    `,
    [Number(mentorId), Number(materiaId)]
  );

  const [rows] = await executor.query(
    `
      SELECT
        mm.id_mentor_materia,
        mm.id_mentor,
        mm.id_materia,
        m.nombre AS materia_nombre,
        m.codigo AS materia_codigo
      FROM mentor_materias mm
      INNER JOIN materias m ON m.id_materia = mm.id_materia
      WHERE mm.id_mentor = ? AND mm.id_materia = ?
      LIMIT 1
    `,
    [Number(mentorId), Number(materiaId)]
  );

  return rows.length ? toMentorMateria(rows[0]) : null;
}

async function deleteByMentorId(mentorId, executor = pool) {
  await executor.query('DELETE FROM mentor_materias WHERE id_mentor = ?', [Number(mentorId)]);
}

module.exports = {
  findAll,
  findByMentorId,
  exists,
  create,
  deleteByMentorId,
};
