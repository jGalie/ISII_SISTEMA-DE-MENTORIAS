/**
 * Entidad: relacion N:M mentor - materia.
 * @typedef {Object} MentorMateria
 * @property {number} id_mentor_materia
 * @property {number} id_mentor
 * @property {number} id_materia
 */

function mapearMentorMateria(row) {
  return {
    id_mentor_materia: row.id_mentor_materia ?? row.id,
    id_mentor: row.id_mentor,
    id_materia: row.id_materia,
    materia_nombre: row.materia_nombre ?? null,
    materia_codigo: row.materia_codigo ?? null,
  };
}

module.exports = { mapearMentorMateria };
