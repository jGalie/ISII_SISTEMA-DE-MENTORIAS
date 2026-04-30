/**
 * Entidad: relación N:M mentor ↔ materia.
 * @typedef {Object} MentorMateria
 * @property {number} id
 * @property {number} mentorId
 * @property {number} materiaId
 */

function mapearMentorMateria(row) {
  return {
    id: row.id ?? row.id_mentor_materia,
    mentorId: row.mentorId ?? row.id_mentor,
    materiaId: row.materiaId ?? row.id_materia,
    materiaNombre: row.materiaNombre ?? row.materia_nombre ?? null,
    materiaCodigo: row.materiaCodigo ?? row.materia_codigo ?? null,
  };
}

module.exports = { mapearMentorMateria };
