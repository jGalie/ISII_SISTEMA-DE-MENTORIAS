function crearErrorApp(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function crearServicioSeguimiento({ seguimientoRepository, inscripcionRepository }) {
  function obtenerNotas(body = {}) {
    const notas = String(body.notas || '').trim();
    if (!notas) {
      throw crearErrorApp('Las notas del seguimiento son obligatorias', 'VALIDATION_ERROR');
    }

    return notas;
  }

  async function validarInscripcionAceptada(id_inscripcion) {
    const id_inscripcion_normalizado = Number(id_inscripcion);
    if (!id_inscripcion_normalizado) {
      throw crearErrorApp('La inscripcion indicada no existe', 'VALIDATION_ERROR');
    }

    const inscripcion = await inscripcionRepository.obtenerPorId(id_inscripcion_normalizado);
    if (!inscripcion) {
      throw crearErrorApp('La inscripcion indicada no existe', 'NOT_FOUND');
    }

    if (inscripcion.estado !== 'aceptada') {
      throw crearErrorApp(
        'El seguimiento academico solo esta disponible para inscripciones aceptadas',
        'VALIDATION_ERROR'
      );
    }

    return inscripcion;
  }

  return {
    validarInscripcionAceptada,

    async listarSeguimientos() {
      return seguimientoRepository.buscarTodos();
    },

    async listarSeguimientosPorInscripcion(id_inscripcion) {
      await validarInscripcionAceptada(id_inscripcion);
      return seguimientoRepository.buscarPorInscripcion(id_inscripcion);
    },

    async registrarSeguimiento(body = {}) {
      const id_inscripcion = Number(body.id_inscripcion);
      const notas = obtenerNotas(body);
      await validarInscripcionAceptada(id_inscripcion);

      return seguimientoRepository.crear({
        id_inscripcion,
        notas,
        fecha_seguimiento: body.fecha_seguimiento,
      });
    },
  };
}

module.exports = {
  crearServicioSeguimiento,
};
