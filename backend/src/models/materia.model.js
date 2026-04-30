/**
 * Entidad: Materia.
 * @typedef {Object} Materia
 * @property {number} id
 * @property {string} nombre
 * @property {string} codigo
 */

function mapearMateria(row) {
  return {
    id: row.id ?? row.id_materia,
    nombre: row.nombre,
    codigo: row.codigo,
  };
}

module.exports = { mapearMateria };
