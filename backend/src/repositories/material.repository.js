const { mapearMaterial } = require('../models/material.model');

let nextId = 1;
const store = [];

function buscarTodos() {
  return store.map((r) => mapearMaterial(r));
}

function buscarPorId(id) {
  const row = store.find((r) => r.id === Number(id));
  return row ? mapearMaterial(row) : null;
}

function crear(data) {
  const row = {
    id: nextId++,
    claseId: Number(data.claseId),
    titulo: data.titulo,
    url: data.url || '',
  };
  store.push(row);
  return mapearMaterial(row);
}

module.exports = {
  buscarTodos,
  buscarPorId,
  crear,
};
