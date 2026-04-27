function createAppError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function createValoracionService({ valoracionRepository, claseRepository, usuarioRepository, inscripcionRepository }) {
  return {
    async crearValoracion(data) {
      const id_clase = Number(data?.id_clase || data?.claseId);
      const id_estudiante = Number(data?.id_estudiante || data?.estudianteId);
      const estrellas = Number(data?.estrellas);
      const comentario = String(data?.comentario || '').trim();

      if (!id_clase || !id_estudiante) {
        throw createAppError('Debes indicar clase y estudiante.', 'VALIDATION_ERROR');
      }
      if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
        throw createAppError('La valoracion debe tener entre 1 y 5 estrellas.', 'VALIDATION_ERROR');
      }

      const estudiante = await usuarioRepository.findById(id_estudiante);
      if (!estudiante || estudiante.rol !== 'estudiante') {
        throw createAppError('Solo un estudiante puede valorar una clase.', 'FORBIDDEN');
      }

      const clase = await claseRepository.buscarPorId(id_clase);
      if (!clase) {
        throw createAppError('Clase no encontrada.', 'NOT_FOUND');
      }

      const inscripcion = await inscripcionRepository.findExisting(id_estudiante, id_clase);
      if (!inscripcion || inscripcion.estado !== 'aceptada') {
        throw createAppError('Solo puedes valorar clases en las que fuiste aceptado.', 'FORBIDDEN');
      }

      const yaValoro = await valoracionRepository.existeDeEstudianteEnClase(id_estudiante, id_clase);
      if (yaValoro) {
        throw createAppError('Ya valoraste esta clase.', 'DUPLICATE_REVIEW');
      }

      return valoracionRepository.crear({
        id_clase,
        id_estudiante,
        id_mentor: clase.mentorId,
        estrellas,
        comentario,
      });
    },

    async listarPorClase(id_clase) {
      return valoracionRepository.buscarPorClase(id_clase);
    },

    async listarPorMentor(id_mentor) {
      return valoracionRepository.buscarPorMentor(id_mentor);
    },
  };
}

module.exports = {
  createValoracionService,
};
