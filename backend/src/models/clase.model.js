/**
 * Entidad: Clase.
 * @typedef {Object} Clase
 * @property {number} id
 * @property {string} titulo
 * @property {string} descripcion
 * @property {string} fecha
 * @property {'virtual'|'presencial'} modalidad
 * @property {number} mentorId
 * @property {?number} materiaId
 * @property {?string} materiaNombre
 * @property {string} mentorNombre
 * @property {string} mentorEmail
 */

function toClase(row) {
  if (!row) return null;
  return {
    id: row.id ?? row.id_clase,
    titulo: row.titulo,
    descripcion: row.descripcion,
    fecha: row.fecha,
    modalidad: row.modalidad || 'virtual',
    mentorId: row.mentorId ?? row.id_mentor,
    materiaId: row.materiaId ?? row.id_materia ?? null,
    materiaNombre: row.materiaNombre ?? row.materia_nombre ?? null,
    mentorNombre: row.mentorNombre ?? row.mentor_nombre ?? null,
    mentorEmail: row.mentorEmail ?? row.mentor_email ?? null,
  };
}

module.exports = { toClase };
