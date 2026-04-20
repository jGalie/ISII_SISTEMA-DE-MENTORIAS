const { toMateria } = require('../models/materia.model');

let nextId = 1;
const store = [];

function seed() {
  store.push(
    { id: nextId++, nombre: 'Ingeniería de Software II', codigo: 'ISII' },
    { id: nextId++, nombre: 'Bases de Datos', codigo: 'BD' },
  );
}
seed();

function findAll() {
  return store.map((r) => toMateria(r));
}

function findById(id) {
  const row = store.find((r) => r.id === Number(id));
  return row ? toMateria(row) : null;
}

function create(data) {
  const row = {
    id: nextId++,
    nombre: data.nombre,
    codigo: data.codigo,
  };
  store.push(row);
  return toMateria(row);
}

module.exports = {
  findAll,
  findById,
  create,
};
