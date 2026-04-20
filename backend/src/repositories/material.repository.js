const { toMaterial } = require('../models/material.model');

let nextId = 1;
const store = [];

function findAll() {
  return store.map((r) => toMaterial(r));
}

function findById(id) {
  const row = store.find((r) => r.id === Number(id));
  return row ? toMaterial(row) : null;
}

function create(data) {
  const row = {
    id: nextId++,
    claseId: Number(data.claseId),
    titulo: data.titulo,
    url: data.url || '',
  };
  store.push(row);
  return toMaterial(row);
}

module.exports = {
  findAll,
  findById,
  create,
};
