const {
  crearObservadorMensajeAutomaticoInscripcion,
} = require('../../src/observers/mensaje-automatico-inscripcion.observer');

describe('Observer de mensajes automaticos por inscripcion', () => {
  test('crea un mensaje automatico cuando la inscripcion fue aceptada', async () => {
    const mensajeRepository = {
      crear: jest.fn().mockResolvedValue({ id_mensaje: 1 }),
    };
    const observer = crearObservadorMensajeAutomaticoInscripcion({ mensajeRepository });

    await observer.actualizar({
      tipo: 'inscripcion.estado_cambiado',
      inscripcion: {
        id_inscripcion: 7,
        id_usuario: 3,
        id_mentor: 9,
        id_clase: 15,
        estado: 'aceptada',
        claseTitulo: 'Algebra inicial',
      },
    });

    expect(mensajeRepository.crear).toHaveBeenCalledWith({
      id_inscripcion: 7,
      id_remitente: 9,
      id_destinatario: 3,
      contenido: 'Tu inscripcion a "Algebra inicial" fue aceptada por el mentor.',
    });
  });

  test('crea un mensaje automatico cuando la inscripcion fue rechazada', async () => {
    const mensajeRepository = {
      crear: jest.fn().mockResolvedValue({ id_mensaje: 2 }),
    };
    const observer = crearObservadorMensajeAutomaticoInscripcion({ mensajeRepository });

    await observer.actualizar({
      tipo: 'inscripcion.estado_cambiado',
      inscripcion: {
        id_inscripcion: 8,
        id_usuario: 4,
        id_mentor: 9,
        id_clase: 16,
        estado: 'rechazada',
        claseTitulo: 'Bases de datos',
      },
    });

    expect(mensajeRepository.crear).toHaveBeenCalledWith({
      id_inscripcion: 8,
      id_remitente: 9,
      id_destinatario: 4,
      contenido: 'Tu inscripcion a "Bases de datos" fue rechazada por el mentor.',
    });
  });

  test('ignora estados que no generan aviso automatico', async () => {
    const mensajeRepository = {
      crear: jest.fn(),
    };
    const observer = crearObservadorMensajeAutomaticoInscripcion({ mensajeRepository });

    await observer.actualizar({
      tipo: 'inscripcion.estado_cambiado',
      inscripcion: {
        id_inscripcion: 9,
        id_usuario: 4,
        id_mentor: 9,
        id_clase: 16,
        estado: 'pendiente',
      },
    });

    expect(mensajeRepository.crear).not.toHaveBeenCalled();
  });
});
