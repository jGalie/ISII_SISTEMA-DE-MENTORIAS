const { mapearMensaje } = require('../models/mensaje.model');

let nextId = 1;
const store = [];

function buscarTodos() {
  return store.map((r) => mapearMensaje(r));
}

function buscarPorId(id) {
  const row = store.find((r) => r.id === Number(id));
  return row ? mapearMensaje(row) : null;
}

function crear(data) {
  const row = {
    id: nextId++,
    remitenteId: Number(data.remitenteId),
    destinatarioId: Number(data.destinatarioId),
    contenido: data.contenido,
    fecha: data.fecha || new Date().toISOString(),
    claseId: data.claseId != null ? Number(data.claseId) : null,
  };
  store.push(row);
  return mapearMensaje(row);
}

module.exports = {
  buscarTodos,
  buscarPorId,
  crear,
};
