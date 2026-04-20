/**
 * Entidad: relación N:M mentor ↔ materia.
 * @typedef {Object} MentorMateria
 * @property {number} id
 * @property {number} mentorId
 * @property {number} materiaId
 */

function toMentorMateria(row) {
  return {
    id: row.id,
    mentorId: row.mentorId,
    materiaId: row.materiaId,
  };
}

module.exports = { toMentorMateria };
