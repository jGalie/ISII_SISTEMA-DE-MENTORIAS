/**
 * Entidad: Clase.
 * @typedef {Object} Clase
 * @property {number} id
 * @property {string} titulo
 * @property {string} descripcion
 * @property {string} fecha
 * @property {number} mentorId
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
    mentorId: row.mentorId ?? row.id_mentor,
    mentorNombre: row.mentorNombre ?? row.mentor_nombre ?? null,
    mentorEmail: row.mentorEmail ?? row.mentor_email ?? null,
  };
}

module.exports = { toClase };
