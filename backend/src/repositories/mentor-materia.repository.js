const { toMentorMateria } = require('../models/mentor-materia.model');

let nextId = 1;
const store = [];

function seed() {
  store.push({ id: nextId++, mentorId: 1, materiaId: 1 });
}
seed();

function findAll() {
  return store.map((r) => toMentorMateria(r));
}

function findById(id) {
  const row = store.find((r) => r.id === Number(id));
  return row ? toMentorMateria(row) : null;
}

function create(data) {
  const row = {
    id: nextId++,
    mentorId: Number(data.mentorId),
    materiaId: Number(data.materiaId),
  };
  store.push(row);
  return toMentorMateria(row);
}

module.exports = {
  findAll,
  findById,
  create,
};
