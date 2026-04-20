const materiaRepository = require('../repositories/materia.repository');

function requireFields(body, fields) {
  for (const f of fields) {
    if (body[f] == null || String(body[f]).trim() === '') {
      throw new Error(`Campo obligatorio: ${f}`);
    }
  }
}

function listar() {
  return materiaRepository.findAll();
}

function crear(body) {
  requireFields(body, ['nombre', 'codigo']);
  return materiaRepository.create(body);
}

module.exports = {
  listar,
  crear,
};
