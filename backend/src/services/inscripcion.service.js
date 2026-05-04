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

    async buscarInscripcionesDelEstudiante(id_usuario) {
      const usuario = await usuarioRepository.buscarPorId(id_usuario);
      this.validarUsuarioEstudiante(usuario);
      return inscripcionRepository.consultarInscripcionesDelEstudiante(id_usuario);
    },

    validarUsuarioEstudiante(usuario) {
      if (!usuario) {
        throw crearErrorApp('Usuario no encontrado.', 'NOT_FOUND');
      }
      if (usuario.rol !== 'estudiante') {
        throw crearErrorApp('Usuario no valido para consultar inscripciones.', 'VALIDATION_ERROR');
      }
    },

    async buscarSolicitudesDelMentor(id_mentor) {
      const mentor = await usuarioRepository.buscarPorId(id_mentor);
      if (!mentor || mentor.rol !== 'mentor') {
        throw crearErrorApp('Mentor no encontrado.', 'NOT_FOUND');
      }
      return inscripcionRepository.buscarSolicitudesDelMentor(id_mentor);
    },

    async buscarInscripcionConClase(id_inscripcion) {
      const inscripcion = await inscripcionRepository.obtenerPorId(id_inscripcion);
      if (!inscripcion) {
        throw crearErrorApp('Inscripcion no encontrada.', 'NOT_FOUND');
      }

      const id_clase = inscripcion.id_clase || inscripcion.claseId;
      const clase = await claseRepository.buscarPorId(id_clase);
      if (!clase) {
        throw crearErrorApp('Clase asociada no encontrada.', 'NOT_FOUND');
      }

      return { inscripcion, clase };
    },

    async validarMentorInscripcion(inscripcion, id_mentor) {
      const id_mentor_normalizado = Number(id_mentor);
      if (!id_mentor_normalizado) {
        throw crearErrorApp('Debes indicar el mentor para gestionar la inscripcion.', 'VALIDATION_ERROR');
      }

      const mentor = await usuarioRepository.buscarPorId(id_mentor_normalizado);
      if (!mentor || mentor.rol !== 'mentor') {
        throw crearErrorApp('Mentor no valido para actualizar la inscripcion.', 'VALIDATION_ERROR');
      }

      if (Number(inscripcion.mentorId || inscripcion.id_mentor) !== id_mentor_normalizado) {
        throw crearErrorApp('No puedes gestionar inscripciones de otra clase.', 'FORBIDDEN');
      }
    },

    async verificarCupoDisponible(clase) {
      if (clase.completa) {
        throw crearErrorApp('La clase ya no tiene cupos disponibles.', 'VALIDATION_ERROR');
      }
    },

    async cambiarEstadoAceptada(id_inscripcion) {
      return inscripcionRepository.cambiarEstadoAceptada(id_inscripcion);
    },

    async cambiarEstadoRechazada(id_inscripcion) {
      return inscripcionRepository.cambiarEstadoRechazada(id_inscripcion);
    },

    async cambiarEstadoPendiente(id_inscripcion) {
      return inscripcionRepository.cambiarEstadoPendiente(id_inscripcion);
    },

    async aceptarInscripcion(id_inscripcion, id_mentor) {
      const { inscripcion, clase } = await this.buscarInscripcionConClase(id_inscripcion);
      const id_clase = inscripcion.claseId || inscripcion.id_clase;
      await this.validarMentorInscripcion(inscripcion, id_mentor);

      if (inscripcion.estado !== 'aceptada') {
        await this.verificarCupoDisponible(clase);
        const claseActualizada = await claseRepository.incrementarCupoActual(id_clase);
        if (!claseActualizada) {
          throw crearErrorApp('La clase ya no tiene cupos disponibles.', 'VALIDATION_ERROR');
        }
      }

      return this.cambiarEstadoAceptada(id_inscripcion);
    },

    async rechazarInscripcion(id_inscripcion, id_mentor) {
      const { inscripcion } = await this.buscarInscripcionConClase(id_inscripcion);
      const id_clase = inscripcion.claseId || inscripcion.id_clase;
      await this.validarMentorInscripcion(inscripcion, id_mentor);

      if (inscripcion.estado === 'aceptada') {
        await claseRepository.decrementarCupoActual(id_clase);
      }

      return this.cambiarEstadoRechazada(id_inscripcion);
    },

    async marcarInscripcionPendiente(id_inscripcion, id_mentor) {
      const { inscripcion } = await this.buscarInscripcionConClase(id_inscripcion);
      const id_clase = inscripcion.claseId || inscripcion.id_clase;
      await this.validarMentorInscripcion(inscripcion, id_mentor);

      if (inscripcion.estado === 'aceptada') {
        await claseRepository.decrementarCupoActual(id_clase);
      }

      return this.cambiarEstadoPendiente(id_inscripcion);
    },

    async cambiarEstadoInscripcion(id_inscripcion, datosInscripcion) {
      const estado = String(datosInscripcion?.estado || '').trim().toLowerCase();
      const id_mentor = Number(datosInscripcion?.id_mentor || datosInscripcion?.mentorId);

      if (estado === 'aceptada') {
        return this.aceptarInscripcion(id_inscripcion, id_mentor);
      }

      if (estado === 'rechazada') {
        return this.rechazarInscripcion(id_inscripcion, id_mentor);
      }

      if (estado === 'pendiente') {
        return this.marcarInscripcionPendiente(id_inscripcion, id_mentor);
      }

      throw crearErrorApp('Estado de inscripcion invalido.', 'VALIDATION_ERROR');
    },
  };
}

module.exports = {
  crearServicioInscripcion,
};
