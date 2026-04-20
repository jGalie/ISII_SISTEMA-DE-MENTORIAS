function createAppError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function validateClasePayload(data) {
  const titulo = String(data?.titulo || '').trim();
  const descripcion = String(data?.descripcion || '').trim();
  const fecha = String(data?.fecha || '').trim();

  if (!titulo || !descripcion || !fecha) {
    throw createAppError('Título, descripción y fecha son obligatorios.', 'VALIDATION_ERROR');
  }

  return { titulo, descripcion, fecha };
}

function createClaseService({ claseRepository, usuarioRepository }) {
  return {
    async crearClase(data) {
      const payload = validateClasePayload(data);
      const id_mentor = Number(data?.id_mentor || data?.mentorId);

      if (!id_mentor) {
        throw createAppError('Debes indicar el mentor creador.', 'VALIDATION_ERROR');
      }

      const mentor = await usuarioRepository.findById(id_mentor);
      if (!mentor || mentor.rol !== 'mentor') {
        throw createAppError('Solo un mentor puede crear clases.', 'FORBIDDEN');
      }

      return claseRepository.createClase({ ...payload, id_mentor });
    },

    async listarClases() {
      return claseRepository.findAll();
    },

    async obtenerClase(id) {
      const clase = await claseRepository.findById(id);
      if (!clase) {
        throw createAppError('Clase no encontrada.', 'NOT_FOUND');
      }
      return clase;
    },

    async listarClasesPorMentor(id_mentor) {
      const mentor = await usuarioRepository.findById(id_mentor);
      if (!mentor || mentor.rol !== 'mentor') {
        throw createAppError('Mentor no encontrado.', 'NOT_FOUND');
      }
      return claseRepository.findByMentor(id_mentor);
    },

    async actualizarClase(id, data) {
      const payload = validateClasePayload(data);
      const actorId = Number(data?.id_mentor || data?.mentorId);
      const clase = await claseRepository.findById(id);

      if (!clase) {
        throw createAppError('Clase no encontrada.', 'NOT_FOUND');
      }
      if (!actorId || actorId !== clase.mentorId) {
        throw createAppError('Solo el mentor creador puede editar esta clase.', 'FORBIDDEN');
      }

      return claseRepository.updateClase(id, payload);
    },

    async eliminarClase(id, data) {
      const actorId = Number(data?.id_mentor || data?.mentorId);
      const clase = await claseRepository.findById(id);

      if (!clase) {
        throw createAppError('Clase no encontrada.', 'NOT_FOUND');
      }
      if (!actorId || actorId !== clase.mentorId) {
        throw createAppError('Solo el mentor creador puede eliminar esta clase.', 'FORBIDDEN');
      }

      return claseRepository.deleteClase(id);
    },
  };
}

module.exports = {
  createClaseService,
};
