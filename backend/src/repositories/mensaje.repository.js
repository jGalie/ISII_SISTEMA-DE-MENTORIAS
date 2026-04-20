const { toMensaje } = require('../models/mensaje.model');

let nextId = 1;
const store = [];

function findAll() {
  return store.map((r) => toMensaje(r));
}

function findById(id) {
  const row = store.find((r) => r.id === Number(id));
  return row ? toMensaje(row) : null;
}

function create(data) {
  const row = {
    id: nextId++,
    remitenteId: Number(data.remitenteId),
    destinatarioId: Number(data.destinatarioId),
    contenido: data.contenido,
    fecha: data.fecha || new Date().toISOString(),
    claseId: data.claseId != null ? Number(data.claseId) : null,
  };
  store.push(row);
  return toMensaje(row);
}

module.exports = {
  findAll,
  findById,
  create,
};
