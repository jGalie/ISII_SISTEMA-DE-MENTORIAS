const { EstadoAceptadaStrategy } = require('./estado-aceptada.strategy');
const { EstadoPendienteStrategy } = require('./estado-pendiente.strategy');
const { EstadoRechazadaStrategy } = require('./estado-rechazada.strategy');

function crearEstrategiasEstadoInscripcion(dependencies) {
  return {
    aceptada: new EstadoAceptadaStrategy(dependencies),
    pendiente: new EstadoPendienteStrategy(dependencies),
    rechazada: new EstadoRechazadaStrategy(dependencies),
  };
}

module.exports = {
  crearEstrategiasEstadoInscripcion,
};
