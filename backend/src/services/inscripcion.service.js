function crearErrorApp(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function crearServicioInscripcion({ inscripcionRepository, claseRepository, usuarioRepository }) {
  return {
    async solicitarInscripcion(solicitudInscripcion) {
      /**
       * Este es el flujo central para estudiantes:
       * solicitar una clase sin duplicar registros ni permitir
       * inconsistencias como inscribirse en la propia publicacion.
       */
      const id_usuario = Number(solicitudInscripcion?.id_usuario || solicitudInscripcion?.idUsuario);
      const id_clase = Number(solicitudInscripcion?.id_clase || solicitudInscripcion?.idClase);

      if (!id_usuario || !id_clase) {
        throw crearErrorApp('Debes indicar usuario y clase para inscribirte.', 'VALIDATION_ERROR');
      }

      const usuario = await usuarioRepository.buscarPorId(id_usuario);
      if (!usuario || usuario.rol !== 'estudiante') {
        throw crearErrorApp('Solo un estudiante puede solicitar una inscripcion.', 'VALIDATION_ERROR');
      }

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

      const inscripcionExistente = await inscripcionRepository.buscarExistente(id_usuario, id_clase);
      if (inscripcionExistente) {
        throw crearErrorApp('Ya existe una inscripcion para esa clase.', 'DUPLICATE_ENROLLMENT');
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

    async buscarSolicitudesDelMentor(mentorId) {
      const mentor = await usuarioRepository.buscarPorId(mentorId);
      if (!mentor || mentor.rol !== 'mentor') {
        throw crearErrorApp('Mentor no encontrado.', 'NOT_FOUND');
      }
      return inscripcionRepository.buscarSolicitudesDelMentor(mentorId);
    },

    async buscarInscripcion(idInscripcion) {
      const inscripcion = await inscripcionRepository.obtenerPorId(idInscripcion);
      if (!inscripcion) {
        throw crearErrorApp('Inscripcion no encontrada.', 'NOT_FOUND');
      }
      return inscripcion;
    },

    async buscarClaseDeInscripcion(inscripcion) {
      const clase = await claseRepository.buscarPorId(inscripcion.claseId);
      if (!clase) {
        throw crearErrorApp('La clase indicada no existe.', 'NOT_FOUND');
      }
      return clase;
    },

    async validarMentorInscripcion(inscripcion, mentorId) {
      const idMentor = Number(mentorId);
      if (!idMentor) {
        throw crearErrorApp('Debes indicar el mentor para gestionar la inscripcion.', 'VALIDATION_ERROR');
      }

      const mentor = await usuarioRepository.buscarPorId(idMentor);
      if (!mentor || mentor.rol !== 'mentor') {
        throw crearErrorApp('Mentor no valido para actualizar la inscripcion.', 'VALIDATION_ERROR');
      }

      if (Number(inscripcion.mentorId) !== idMentor) {
        throw crearErrorApp('No puedes gestionar inscripciones de otra clase.', 'FORBIDDEN');
      }
    },

    async verificarCupoDisponible(clase) {
      if (clase.completa) {
        throw crearErrorApp('La clase ya no tiene cupos disponibles.', 'VALIDATION_ERROR');
      }
    },

    async incrementarCupoInscripcion(inscripcion) {
      if (inscripcion.estado === 'aceptada') return null;

      const claseActualizada = await claseRepository.incrementarCupoActual(inscripcion.claseId);
      if (!claseActualizada) {
        throw crearErrorApp('La clase ya no tiene cupos disponibles.', 'VALIDATION_ERROR');
      }
      return claseActualizada;
    },

    async decrementarCupoInscripcion(inscripcion) {
      if (inscripcion.estado !== 'aceptada') return null;
      return claseRepository.decrementarCupoActual(inscripcion.claseId);
    },

    async cambiarEstadoAceptada(idInscripcion) {
      return inscripcionRepository.cambiarEstadoAceptada(idInscripcion);
    },

    async cambiarEstadoRechazada(idInscripcion) {
      return inscripcionRepository.cambiarEstadoRechazada(idInscripcion);
    },

    async cambiarEstadoPendiente(idInscripcion) {
      return inscripcionRepository.cambiarEstadoPendiente(idInscripcion);
    },

    async aceptarInscripcion(idInscripcion, mentorId) {
      const inscripcion = await this.buscarInscripcion(idInscripcion);
      const clase = await this.buscarClaseDeInscripcion(inscripcion);
      await this.validarMentorInscripcion(inscripcion, mentorId);

      if (inscripcion.estado !== 'aceptada') {
        await this.verificarCupoDisponible(clase);
        await this.incrementarCupoInscripcion(inscripcion);
      }

      return this.cambiarEstadoAceptada(idInscripcion);
    },

    async rechazarInscripcion(idInscripcion, mentorId) {
      const inscripcion = await this.buscarInscripcion(idInscripcion);
      await this.buscarClaseDeInscripcion(inscripcion);
      await this.validarMentorInscripcion(inscripcion, mentorId);
      await this.decrementarCupoInscripcion(inscripcion);
      return this.cambiarEstadoRechazada(idInscripcion);
    },

    async marcarInscripcionPendiente(idInscripcion, mentorId) {
      const inscripcion = await this.buscarInscripcion(idInscripcion);
      await this.buscarClaseDeInscripcion(inscripcion);
      await this.validarMentorInscripcion(inscripcion, mentorId);
      await this.decrementarCupoInscripcion(inscripcion);
      return this.cambiarEstadoPendiente(idInscripcion);
    },

    async cambiarEstadoInscripcion(idInscripcion, datosInscripcion) {
      const estado = String(datosInscripcion?.estado || '').trim().toLowerCase();
      const mentorId = Number(datosInscripcion?.mentorId || datosInscripcion?.id_mentor);

      if (estado === 'aceptada') {
        return this.aceptarInscripcion(idInscripcion, mentorId);
      }

      if (estado === 'rechazada') {
        return this.rechazarInscripcion(idInscripcion, mentorId);
      }

      if (estado === 'pendiente') {
        return this.marcarInscripcionPendiente(idInscripcion, mentorId);
      }

      throw crearErrorApp('Estado de inscripcion invalido.', 'VALIDATION_ERROR');
    },
  };
}

module.exports = {
  crearServicioInscripcion,
};
