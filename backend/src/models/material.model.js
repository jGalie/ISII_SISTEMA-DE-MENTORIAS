/**
 * Entidad: Material de apoyo de una clase.
 * @typedef {Object} Material
 * @property {number} id
 * @property {number} claseId
 * @property {string} titulo
 * @property {string} url
 */

function toMaterial(row) {
  return {
    id: row.id,
    claseId: row.claseId,
    titulo: row.titulo,
    url: row.url,
  };
}

module.exports = { toMaterial };
