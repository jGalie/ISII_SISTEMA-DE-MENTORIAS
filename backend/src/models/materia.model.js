/**
 * Entidad: Materia.
 * @typedef {Object} Materia
 * @property {number} id
 * @property {string} nombre
 * @property {string} codigo
 */

function toMateria(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    codigo: row.codigo,
  };
}

module.exports = { toMateria };
