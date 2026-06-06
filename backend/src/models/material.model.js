/**
 * Entidad: Material de apoyo de una clase.
 * @typedef {Object} Material
 * @property {number} id
 * @property {number} id_clase
 * @property {string} titulo
 * @property {string} url
 */

function mapearMaterial(row) {
  return {
    id: row.id,
    id_clase: row.id_clase,
    titulo: row.titulo,
    url: row.url,
  };
}

module.exports = { mapearMaterial };
