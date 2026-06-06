function crearErrorApp(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function crearServicioMateria({ materiaRepository }) {
  function normalizarMateria(body = {}) {
    const nombre = String(body.nombre || '').trim();
    const codigo = String(body.codigo || nombre).trim();

    if (!nombre) {
      throw crearErrorApp('El nombre de la materia es obligatorio', 'VALIDATION_ERROR');
    }

    return { nombre, codigo };
  }

  return {
    async listarMaterias() {
      return materiaRepository.buscarTodos();
    },

    async crearMateria(body = {}) {
      return materiaRepository.crear(normalizarMateria(body));
    },
  };
}

module.exports = {
  crearServicioMateria,
};
