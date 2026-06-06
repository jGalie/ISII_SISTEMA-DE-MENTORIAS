/**
 * Entidad: Materia.
 * @typedef {Object} Materia
 * @property {number} id
 * @property {number} id_materia
 * @property {string} nombre
 * @property {string} codigo
 */

function mapearMateria(row) {
  return {
    id: row.id ?? row.id_materia,
    id_materia: row.id_materia ?? row.id,
    nombre: row.nombre,
    codigo: row.codigo,
  };
}

module.exports = { mapearMateria };
