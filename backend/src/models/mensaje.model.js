/**
 * Entidad: Mensaje entre usuarios (contexto opcional de clase).
 * @typedef {Object} Mensaje
 * @property {number} id
 * @property {number} remitenteId
 * @property {number} destinatarioId
 * @property {string} contenido
 * @property {string} fecha ISO date
 * @property {number|null} claseId
 */

function mapearMensaje(row) {
  return {
    id: row.id,
    remitenteId: row.remitenteId,
    destinatarioId: row.destinatarioId,
    contenido: row.contenido,
    fecha: row.fecha,
    claseId: row.claseId ?? null,
  };
}

module.exports = { mapearMensaje };
