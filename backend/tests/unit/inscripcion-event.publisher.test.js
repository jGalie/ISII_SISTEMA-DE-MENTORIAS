const {
  crearPublicadorEventosInscripcion,
} = require('../../src/events/inscripcion-event.publisher');

describe('Publicador de eventos de inscripcion', () => {
  test('notifica a todos los observers suscriptos cuando cambia el estado', async () => {
    const publisher = crearPublicadorEventosInscripcion();
    const observerA = { actualizar: jest.fn().mockResolvedValue(undefined) };
    const observerB = { actualizar: jest.fn().mockResolvedValue(undefined) };
    const evento = {
      tipo: 'inscripcion.estado_cambiado',
      inscripcion: {
        id_inscripcion: 7,
        estado: 'aceptada',
      },
    };

    publisher.suscribir(observerA);
    publisher.suscribir(observerB);
    await publisher.notificarCambioEstado(evento);

    expect(observerA.actualizar).toHaveBeenCalledWith(evento);
    expect(observerB.actualizar).toHaveBeenCalledWith(evento);
  });
});
