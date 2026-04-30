const { mapearSeguimiento } = require('../models/seguimiento.model');

let nextId = 1;
const store = [];

function buscarTodos() {
  return store.map((r) => mapearSeguimiento(r));
}

function buscarPorId(id) {
  const row = store.find((r) => r.id === Number(id));
  return row ? mapearSeguimiento(row) : null;
}

function crear(data) {
  const row = {
    id: nextId++,
    inscripcionId: Number(data.inscripcionId),
    notas: data.notas,
    fecha: data.fecha || new Date().toISOString(),
  };
  store.push(row);
  return mapearSeguimiento(row);
}

module.exports = {
  buscarTodos,
  buscarPorId,
  crear,
};
