function crearErrorApp(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function obtenerIdUsuarioActor(datosMensaje = {}) {
  return Number(datosMensaje.id_usuario || datosMensaje.usuarioId);
}

function rechazarDestinatarioManual(datosMensaje = {}) {
  if (datosMensaje.id_destinatario || datosMensaje.destinatarioId) {
    throw crearErrorApp('El destinatario se infiere desde la inscripcion y no debe enviarse manualmente.', 'VALIDATION_ERROR');
  }
}

function validarContenido(contenido) {
  const contenidoNormalizado = String(contenido || '').trim();
  if (!contenidoNormalizado) {
    throw crearErrorApp('El contenido del mensaje es obligatorio.', 'VALIDATION_ERROR');
  }

  return contenidoNormalizado;
}

function resolverParticipantes(inscripcion, id_remitente) {
  const id_estudiante = Number(inscripcion.id_usuario);
  const id_mentor = Number(inscripcion.id_mentor);

  if (id_remitente === id_mentor) {
    return { id_remitente, id_destinatario: id_estudiante };
  }

  if (id_remitente === id_estudiante) {
    return { id_remitente, id_destinatario: id_mentor };
  }

  throw crearErrorApp('Solo los usuarios vinculados a la inscripcion pueden enviar mensajes.', 'FORBIDDEN');
}

function crearServicioMensaje({ mensajeRepository, inscripcionRepository, usuarioRepository }) {
  async function obtenerInscripcionConActor(id_inscripcion, id_usuario) {
    const id_inscripcion_normalizado = Number(id_inscripcion);
    if (!id_inscripcion_normalizado) {
      throw crearErrorApp('Debes indicar una inscripcion valida.', 'VALIDATION_ERROR');
    }

    const id_usuario_normalizado = Number(id_usuario);
    if (!id_usuario_normalizado) {
      throw crearErrorApp('Debes indicar el usuario que realiza la accion.', 'VALIDATION_ERROR');
    }

    const inscripcion = await inscripcionRepository.obtenerPorId(id_inscripcion_normalizado);
    if (!inscripcion) {
      throw crearErrorApp('Inscripcion no encontrada.', 'NOT_FOUND');
    }

    const usuario = await usuarioRepository.buscarPorId(id_usuario_normalizado);
    if (!usuario) {
      throw crearErrorApp('Usuario no encontrado.', 'NOT_FOUND');
    }

    const id_estudiante = Number(inscripcion.id_usuario);
    const id_mentor = Number(inscripcion.id_mentor);
    if (![id_estudiante, id_mentor].includes(id_usuario_normalizado)) {
      throw crearErrorApp('No puedes acceder a mensajes de una inscripcion ajena.', 'FORBIDDEN');
    }
    if (id_usuario_normalizado === id_estudiante && usuario.rol !== 'estudiante') {
      throw crearErrorApp('Solo el estudiante asociado puede operar como estudiante de la inscripcion.', 'FORBIDDEN');
    }
    if (id_usuario_normalizado === id_mentor && usuario.rol !== 'mentor') {
      throw crearErrorApp('Solo el mentor creador de la clase puede operar como mentor de la inscripcion.', 'FORBIDDEN');
    }

    return { inscripcion, id_usuario: id_usuario_normalizado };
  }

  return {
    async enviarMensaje(id_inscripcion, datosMensaje) {
      rechazarDestinatarioManual(datosMensaje);
      const contenido = validarContenido(datosMensaje?.contenido);
      const { inscripcion, id_usuario } = await obtenerInscripcionConActor(
        id_inscripcion,
        obtenerIdUsuarioActor(datosMensaje)
      );
      const participantes = resolverParticipantes(inscripcion, id_usuario);

      return mensajeRepository.crearMensaje({
        id_inscripcion: Number(id_inscripcion),
        ...participantes,
        contenido,
      });
    },

    async listarConversacion(id_inscripcion, datosConsulta) {
      await obtenerInscripcionConActor(id_inscripcion, obtenerIdUsuarioActor(datosConsulta));
      return mensajeRepository.buscarPorInscripcion(id_inscripcion);
    },
  };
}

module.exports = {
  crearServicioMensaje,
};
