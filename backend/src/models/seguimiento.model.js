/**
 * Entidad: Seguimiento académico vinculado a una inscripción.
 * @typedef {Object} Seguimiento
 * @property {number} id
 * @property {number} inscripcionId
 * @property {string} notas
 * @property {string} fecha ISO date
 */

function toSeguimiento(row) {
  return {
    id: row.id,
    inscripcionId: row.inscripcionId,
    notas: row.notas,
    fecha: row.fecha,
  };
}

module.exports = { toSeguimiento };
