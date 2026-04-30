const materiaRepository = require('../repositories/materia.repository');

function requerirCampos(body, fields) {
  for (const field of fields) {
    if (body[field] == null || String(body[field]).trim() === '') {
      throw new Error(`Campo obligatorio: ${field}`);
    }
  }
}

async function listar() {
  return materiaRepository.buscarTodos();
}

async function crear(body) {
  requerirCampos(body, ['nombre', 'codigo']);
  return materiaRepository.crear(body);
}

module.exports = {
  listar,
  crear,
};
