const { toSeguimiento } = require('../models/seguimiento.model');

let nextId = 1;
const store = [];

function findAll() {
  return store.map((r) => toSeguimiento(r));
}

function findById(id) {
  const row = store.find((r) => r.id === Number(id));
  return row ? toSeguimiento(row) : null;
}

function create(data) {
  const row = {
    id: nextId++,
    inscripcionId: Number(data.inscripcionId),
    notas: data.notas,
    fecha: data.fecha || new Date().toISOString(),
  };
  store.push(row);
  return toSeguimiento(row);
}

module.exports = {
  findAll,
  findById,
  create,
};
