const materiaRepository = require('../repositories/materia.repository');

function requireFields(body, fields) {
  for (const field of fields) {
    if (body[field] == null || String(body[field]).trim() === '') {
      throw new Error(`Campo obligatorio: ${field}`);
    }
  }
}

async function listar() {
  return materiaRepository.findAll();
}

async function crear(body) {
  requireFields(body, ['nombre', 'codigo']);
  return materiaRepository.create(body);
}

module.exports = {
  listar,
  crear,
};
