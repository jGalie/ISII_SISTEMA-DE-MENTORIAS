const materiaRepository = require('../repositories/materia.repository');

function requerirCampos(body, fields) {
  for (const field of fields) {
    if (body[field] == null || String(body[field]).trim() === '') {
      throw new Error(`Campo obligatorio: ${field}`);
    }
  }
}

async function listarMaterias() {
  return materiaRepository.buscarTodos();
}

async function crearMateria(body) {
  requerirCampos(body, ['nombre', 'codigo']);
  return materiaRepository.crear(body);
}

module.exports = {
  listarMaterias,
  crearMateria,
};
