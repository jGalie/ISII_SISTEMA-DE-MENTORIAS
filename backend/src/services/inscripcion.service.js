function crearErrorApp(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function crearServicioInscripcion({ inscripcionRepository, claseRepository, usuarioRepository }) {
  return {
    async solicitarInscripcion(data) {
      /**
       * Este es el flujo central para estudiantes:
       * solicitar una clase sin duplicar registros ni permitir
       * inconsistencias como inscribirse en la propia publicacion.
       */
      const id_usuario = Number(data?.id_usuario || data?.idUsuario);
      const id_clase = Number(data?.id_clase || data?.idClase);

      if (!id_usuario || !id_clase) {
        throw crearErrorApp('Debes indicar usuario y clase para inscribirte.', 'VALIDATION_ERROR');
      }

      const usuario = await usuarioRepository.buscarPorId(id_usuario);
      if (!usuario || usuario.rol !== 'estudiante') {
        throw crearErrorApp('Solo un estudiante puede solicitar una inscripción.', 'VALIDATION_ERROR');
      }

      // Se consulta la clase mediante el repository inyectado para confirmar
      // que el recurso exista antes de crear la relacion de inscripcion.
      const clase = await claseRepository.buscarPorId(id_clase);
      if (!clase) {
        throw crearErrorApp('La clase indicada no existe.', 'NOT_FOUND');
      }
      if (clase.completa) {
        throw crearErrorApp('La clase ya no tiene cupos disponibles.', 'VALIDATION_ERROR');
      }
      if (clase.mentorId === id_usuario) {
        throw crearErrorApp('No puedes inscribirte en tu propia clase.', 'VALIDATION_ERROR');
      }

      const existing = await inscripcionRepository.buscarExistente(id_usuario, id_clase);
      if (existing) {
        throw crearErrorApp('Ya existe una inscripción para esa clase.', 'DUPLICATE_ENROLLMENT');
      }

      return inscripcionRepository.crearInscripcion({ id_usuario, id_clase, estado: 'pendiente' });
    },

    async obtenerInscripcionesUsuario(idUsuario) {
      const usuario = await usuarioRepository.buscarPorId(idUsuario);
      if (!usuario) {
        throw crearErrorApp('Usuario no encontrado.', 'NOT_FOUND');
      }
      return inscripcionRepository.obtenerPorUsuario(idUsuario);
    },

    async obtenerInscripcionesMentor(idMentor) {
      const mentor = await usuarioRepository.buscarPorId(idMentor);
      if (!mentor || mentor.rol !== 'mentor') {
        throw crearErrorApp('Mentor no encontrado.', 'NOT_FOUND');
      }
      return inscripcionRepository.obtenerPorMentor(idMentor);
    },

    async cambiarEstadoInscripcion(idInscripcion, data) {
      // Esta operacion representa la decision del mentor sobre una solicitud
      // y valida que realmente tenga permiso sobre esa clase.
      const estado = String(data?.estado || '').trim();
      const mentorId = Number(data?.mentorId || data?.id_mentor);
      const validStates = new Set(['pendiente', 'aceptada', 'rechazada']);

      if (!validStates.has(estado)) {
        throw crearErrorApp('Estado de inscripción inválido.', 'VALIDATION_ERROR');
      }

      const inscripcion = await inscripcionRepository.obtenerPorId(idInscripcion);
      if (!inscripcion) {
        throw crearErrorApp('Inscripción no encontrada.', 'NOT_FOUND');
      }

      if (mentorId) {
        const mentor = await usuarioRepository.buscarPorId(mentorId);
        if (!mentor || mentor.rol !== 'mentor') {
          throw crearErrorApp('Mentor no válido para actualizar la inscripción.', 'VALIDATION_ERROR');
        }
        if (inscripcion.mentorId !== mentorId) {
          throw crearErrorApp('No puedes gestionar inscripciones de otra clase.', 'FORBIDDEN');
        }
      }

      if (estado === 'aceptada' && inscripcion.estado !== 'aceptada') {
        const clase = await claseRepository.buscarPorId(inscripcion.claseId);
        if (!clase) {
          throw crearErrorApp('La clase indicada no existe.', 'NOT_FOUND');
        }
        if (clase.completa) {
          throw crearErrorApp('La clase ya no tiene cupos disponibles.', 'VALIDATION_ERROR');
        }
        const claseActualizada = await claseRepository.incrementarCupoActual(inscripcion.claseId);
        if (!claseActualizada) {
          throw crearErrorApp('La clase ya no tiene cupos disponibles.', 'VALIDATION_ERROR');
        }
      }

      if (inscripcion.estado === 'aceptada' && estado !== 'aceptada') {
        await claseRepository.decrementarCupoActual(inscripcion.claseId);
      }

      return inscripcionRepository.actualizarEstado(idInscripcion, estado);
    },
  };
}

module.exports = {
  crearServicioInscripcion,
};
