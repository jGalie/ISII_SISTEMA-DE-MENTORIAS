function createAppError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

class EstadoInscripcionStrategy {
  constructor({ inscripcionRepository, claseRepository, usuarioRepository }) {
    this.inscripcionRepository = inscripcionRepository;
    this.claseRepository = claseRepository;
    this.usuarioRepository = usuarioRepository;
  }

  async ejecutar() {
    throw createAppError('La estrategia debe implementar ejecutar().', 'STRATEGY_NOT_IMPLEMENTED');
  }

  async obtenerInscripcionGestionable(idInscripcion, idMentor) {
    const inscripcion = await this.inscripcionRepository.obtenerPorId(idInscripcion);
    if (!inscripcion) {
      throw createAppError('Inscripcion no encontrada.', 'NOT_FOUND');
    }

    const idMentorNormalizado = Number(idMentor);
    if (!idMentorNormalizado) {
      throw createAppError('Debes indicar el mentor para gestionar la inscripcion.', 'VALIDATION_ERROR');
    }

    const mentor = await this.usuarioRepository.buscarPorId(idMentorNormalizado);
    if (!mentor || mentor.rol !== 'mentor') {
      throw createAppError('Mentor no valido para actualizar la inscripcion.', 'VALIDATION_ERROR');
    }

    if (Number(inscripcion.mentorId || inscripcion.id_mentor) !== idMentorNormalizado) {
      throw createAppError('No puedes gestionar inscripciones de otra clase.', 'FORBIDDEN');
    }

    return inscripcion;
  }
}

module.exports = {
  EstadoInscripcionStrategy,
  createAppError,
};
