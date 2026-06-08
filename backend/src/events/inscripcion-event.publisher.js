function crearPublicadorEventosInscripcion() {
  const observers = [];

  return {
    suscribir(observer) {
      if (!observer || typeof observer.actualizar !== 'function') return;
      observers.push(observer);
    },

    async notificarCambioEstado(evento) {
      for (const observer of observers) {
        await observer.actualizar(evento);
      }
    },
  };
}

module.exports = {
  crearPublicadorEventosInscripcion,
};
