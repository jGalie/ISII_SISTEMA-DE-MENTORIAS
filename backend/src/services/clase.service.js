function createAppError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function validateClasePayload(data) {
  const titulo = String(data?.titulo || '').trim();
  const descripcion = String(data?.descripcion || '').trim();
  const fecha = String(data?.fecha || '').trim();
  const modalidad = String(data?.modalidad || 'virtual').trim().toLowerCase();
  const id_materia = Number(data?.id_materia || data?.materiaId);
  const precio = Number(data?.precio);
  const ubicacion = String(data?.ubicacion || '').trim();

  if (!titulo || !descripcion || !fecha) {
    throw createAppError('Titulo, descripcion y fecha son obligatorios.', 'VALIDATION_ERROR');
  }

  if (!['virtual', 'presencial'].includes(modalidad)) {
    throw createAppError('Modalidad de clase invalida.', 'VALIDATION_ERROR');
  }

  if (!id_materia) {
    throw createAppError('Debes seleccionar una materia para la clase.', 'VALIDATION_ERROR');
  }

  if (!Number.isFinite(precio) || precio < 0) {
    throw createAppError('Debes ingresar un precio valido para la clase.', 'VALIDATION_ERROR');
  }

  if (modalidad === 'presencial' && !ubicacion) {
    throw createAppError('Debes indicar una ubicacion para una clase presencial.', 'VALIDATION_ERROR');
  }

  return {
    titulo,
    descripcion,
    fecha,
    modalidad,
    id_materia,
    precio,
    ubicacion: modalidad === 'presencial' ? ubicacion : null,
  };
}

function createClaseService({ claseRepository, usuarioRepository, mentorMateriaRepository }) {
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

      const hasSubject = await mentorMateriaRepository.exists(id_mentor, payload.id_materia);
      if (!hasSubject) {
        throw createAppError('La materia seleccionada no pertenece a las materias registradas por el mentor.', 'FORBIDDEN');
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

      const hasSubject = await mentorMateriaRepository.exists(actorId, payload.id_materia);
      if (!hasSubject) {
        throw createAppError('La materia seleccionada no pertenece a las materias registradas por el mentor.', 'FORBIDDEN');
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
