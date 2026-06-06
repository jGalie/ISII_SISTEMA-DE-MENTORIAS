function crearErrorApp(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function crearServicioSeguimiento({ seguimientoRepository, inscripcionRepository, usuarioRepository }) {
  function rechazarCamposFueraDeContrato(datos = {}) {
    const campoInvalido = Object.keys(datos).find((campo) => /[A-Z]/.test(campo));
    if (campoInvalido) {
      throw crearErrorApp(`El campo ${campoInvalido} no pertenece al contrato snake_case.`, 'VALIDATION_ERROR');
    }
  }

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

  async function obtenerActor(id_usuario) {
    const id_usuario_normalizado = Number(id_usuario);
    if (!Number.isInteger(id_usuario_normalizado) || id_usuario_normalizado < 1) {
      throw crearErrorApp('Debes indicar el id_usuario del actor.', 'VALIDATION_ERROR');
    }

    const actor = await usuarioRepository.buscarPorId(id_usuario_normalizado);
    if (!actor) {
      throw crearErrorApp('El usuario indicado no existe.', 'NOT_FOUND');
    }

    return { actor, id_usuario: id_usuario_normalizado };
  }

  return {
    async listarSeguimientosPorInscripcion(id_inscripcion, datosConsulta = {}) {
      rechazarCamposFueraDeContrato(datosConsulta);
      const inscripcion = await validarInscripcionAceptada(id_inscripcion);
      const { actor, id_usuario } = await obtenerActor(datosConsulta.id_usuario);
      const esMentorDuenio =
        actor.rol === 'mentor' && id_usuario === Number(inscripcion.id_mentor);
      const esEstudianteInscripto =
        actor.rol === 'estudiante' && id_usuario === Number(inscripcion.id_usuario);

      if (!esMentorDuenio && !esEstudianteInscripto) {
        throw crearErrorApp('No puedes consultar el seguimiento de esta inscripcion.', 'FORBIDDEN');
      }

      return seguimientoRepository.buscarPorInscripcion(id_inscripcion);
    },

    async registrarSeguimiento(body = {}) {
      rechazarCamposFueraDeContrato(body);
      const id_inscripcion = Number(body.id_inscripcion);
      const notas = obtenerNotas(body);
      const inscripcion = await validarInscripcionAceptada(id_inscripcion);
      const { actor, id_usuario } = await obtenerActor(body.id_usuario);

      if (actor.rol !== 'mentor' || id_usuario !== Number(inscripcion.id_mentor)) {
        throw crearErrorApp(
          'Solo el mentor duenio de la clase puede registrar seguimientos.',
          'FORBIDDEN'
        );
      }

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
