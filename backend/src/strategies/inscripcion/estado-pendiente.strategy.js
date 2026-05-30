const { EstadoInscripcionStrategy } = require('./estado-inscripcion.strategy');

class EstadoPendienteStrategy extends EstadoInscripcionStrategy {
  async ejecutar(idInscripcion, idMentor) {
    const inscripcion = await this.obtenerInscripcionGestionable(idInscripcion, idMentor);

    if (inscripcion.estado === 'aceptada') {
      await this.claseRepository.decrementarCupoActual(inscripcion.claseId);
    }

    return this.inscripcionRepository.cambiarEstadoPendiente(idInscripcion);
  }
}

module.exports = {
  EstadoPendienteStrategy,
};
