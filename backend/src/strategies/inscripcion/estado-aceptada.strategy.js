const { EstadoInscripcionStrategy, createAppError } = require('./estado-inscripcion.strategy');

class EstadoAceptadaStrategy extends EstadoInscripcionStrategy {
  async ejecutar(idInscripcion, idMentor) {
    const inscripcion = await this.obtenerInscripcionGestionable(idInscripcion, idMentor);

    if (inscripcion.estado !== 'aceptada') {
      const clase = await this.claseRepository.buscarPorId(inscripcion.claseId);
      if (!clase) {
        throw createAppError('La clase indicada no existe.', 'NOT_FOUND');
      }
      if (clase.completa) {
        throw createAppError('La clase ya no tiene cupos disponibles.', 'VALIDATION_ERROR');
      }

      const claseActualizada = await this.claseRepository.incrementarCupoActual(inscripcion.claseId);
      if (!claseActualizada) {
        throw createAppError('La clase ya no tiene cupos disponibles.', 'VALIDATION_ERROR');
      }
    }

    return this.inscripcionRepository.cambiarEstadoAceptada(idInscripcion);
  }
}

module.exports = {
  EstadoAceptadaStrategy,
};
