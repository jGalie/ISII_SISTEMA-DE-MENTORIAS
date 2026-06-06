function crearErrorApp(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function crearServicioMentorMateria({ mentorMateriaRepository, usuarioRepository, materiaRepository }) {
  function normalizarAsociacion(body = {}) {
    const id_mentor = Number(body.id_mentor);
    const id_materia = Number(body.id_materia);

    if (!id_mentor) {
      throw crearErrorApp('El mentor indicado no existe', 'VALIDATION_ERROR');
    }
    if (!id_materia) {
      throw crearErrorApp('La materia indicada no existe', 'VALIDATION_ERROR');
    }

    return { id_mentor, id_materia };
  }

  return {
    async listarMateriasDelMentor(filtros = {}) {
      const id_mentor = Number(filtros.id_mentor || 0);
      if (id_mentor) {
        return mentorMateriaRepository.buscarPorMentor(id_mentor);
      }

      return mentorMateriaRepository.buscarTodos();
    },

    async asociarMateriaMentor(body = {}) {
      const datosAsociacion = normalizarAsociacion(body);

      const mentor = await usuarioRepository.buscarPorId(datosAsociacion.id_mentor);
      if (!mentor || mentor.rol !== 'mentor') {
        throw crearErrorApp('El mentor indicado no existe', 'NOT_FOUND');
      }

      const materia = await materiaRepository.buscarPorId(datosAsociacion.id_materia);
      if (!materia) {
        throw crearErrorApp('La materia indicada no existe', 'NOT_FOUND');
      }

      const asociacionExistente = await mentorMateriaRepository.buscarAsociacion(
        datosAsociacion.id_mentor,
        datosAsociacion.id_materia
      );
      if (asociacionExistente) {
        throw crearErrorApp('La materia ya esta asociada al mentor', 'VALIDATION_ERROR');
      }

      return mentorMateriaRepository.crear(datosAsociacion);
    },
  };
}

module.exports = {
  crearServicioMentorMateria,
};
