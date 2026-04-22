function createAppError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function createInscripcionService({ inscripcionRepository, claseRepository, usuarioRepository }) {
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
        throw createAppError('Debes indicar usuario y clase para inscribirte.', 'VALIDATION_ERROR');
      }

      const usuario = await usuarioRepository.findById(id_usuario);
      if (!usuario || usuario.rol !== 'estudiante') {
        throw createAppError('Solo un estudiante puede solicitar una inscripción.', 'VALIDATION_ERROR');
      }

      // Se consulta la clase mediante el repository inyectado para confirmar
      // que el recurso exista antes de crear la relacion de inscripcion.
      const clase = await claseRepository.buscarPorId(id_clase);
      if (!clase) {
        throw createAppError('La clase indicada no existe.', 'NOT_FOUND');
      }
      if (clase.mentorId === id_usuario) {
        throw createAppError('No puedes inscribirte en tu propia clase.', 'VALIDATION_ERROR');
      }

      const existing = await inscripcionRepository.findExisting(id_usuario, id_clase);
      if (existing) {
        throw createAppError('Ya existe una inscripción para esa clase.', 'DUPLICATE_ENROLLMENT');
      }

      return inscripcionRepository.createInscripcion({ id_usuario, id_clase, estado: 'pendiente' });
    },

    async obtenerInscripcionesUsuario(idUsuario) {
      const usuario = await usuarioRepository.findById(idUsuario);
      if (!usuario) {
        throw createAppError('Usuario no encontrado.', 'NOT_FOUND');
      }
      return inscripcionRepository.getByUsuario(idUsuario);
    },

    async obtenerInscripcionesMentor(idMentor) {
      const mentor = await usuarioRepository.findById(idMentor);
      if (!mentor || mentor.rol !== 'mentor') {
        throw createAppError('Mentor no encontrado.', 'NOT_FOUND');
      }
      return inscripcionRepository.getByMentor(idMentor);
    },

    async cambiarEstadoInscripcion(idInscripcion, data) {
      // Esta operacion representa la decision del mentor sobre una solicitud
      // y valida que realmente tenga permiso sobre esa clase.
      const estado = String(data?.estado || '').trim();
      const mentorId = Number(data?.mentorId || data?.id_mentor);
      const validStates = new Set(['pendiente', 'aceptada', 'rechazada']);

      if (!validStates.has(estado)) {
        throw createAppError('Estado de inscripción inválido.', 'VALIDATION_ERROR');
      }

      const inscripcion = await inscripcionRepository.getById(idInscripcion);
      if (!inscripcion) {
        throw createAppError('Inscripción no encontrada.', 'NOT_FOUND');
      }

      if (mentorId) {
        const mentor = await usuarioRepository.findById(mentorId);
        if (!mentor || mentor.rol !== 'mentor') {
          throw createAppError('Mentor no válido para actualizar la inscripción.', 'VALIDATION_ERROR');
        }
        if (inscripcion.mentorId !== mentorId) {
          throw createAppError('No puedes gestionar inscripciones de otra clase.', 'FORBIDDEN');
        }
      }

      return inscripcionRepository.updateEstado(idInscripcion, estado);
    },
  };
}

module.exports = {
  createInscripcionService,
};
