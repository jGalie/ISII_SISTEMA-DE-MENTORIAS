const { crearServicioMensaje } = require('../../src/services/mensaje.service');

function crearDependencias(overrides = {}) {
  const mensajeRepository = {
    crearMensaje: jest.fn().mockImplementation((mensaje) => Promise.resolve({ id: 1, ...mensaje })),
    buscarPorInscripcion: jest.fn().mockResolvedValue([]),
  };
  const inscripcionRepository = {
    obtenerPorId: jest.fn().mockResolvedValue({
      id: 7,
      id_usuario: 3,
      id_mentor: 9,
    }),
  };
  const usuarioRepository = {
    buscarPorId: jest.fn().mockResolvedValue({ id: 9, rol: 'mentor' }),
  };

  return {
    mensajeRepository,
    inscripcionRepository,
    usuarioRepository,
    ...overrides,
  };
}

describe('Mensajeria interna asociada a inscripcion', () => {
  test('infiere al estudiante como destinatario cuando escribe el mentor', async () => {
    const dependencias = crearDependencias();
    const servicio = crearServicioMensaje(dependencias);

    const resultado = await servicio.enviarMensaje(7, {
      id_usuario: 9,
      contenido: 'Cual es tu nivel previo?',
    });

    expect(dependencias.mensajeRepository.crearMensaje).toHaveBeenCalledWith({
      id_inscripcion: 7,
      id_remitente: 9,
      id_destinatario: 3,
      contenido: 'Cual es tu nivel previo?',
    });
    expect(resultado.id_destinatario).toBe(3);
  });

  test('rechaza mensajes vacios', async () => {
    const servicio = crearServicioMensaje(crearDependencias());

    await expect(servicio.enviarMensaje(7, { id_usuario: 9, contenido: '   ' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  test('rechaza consultas de usuarios ajenos a la inscripcion', async () => {
    const dependencias = crearDependencias({
      usuarioRepository: {
        buscarPorId: jest.fn().mockResolvedValue({ id: 12, rol: 'estudiante' }),
      },
    });
    const servicio = crearServicioMensaje(dependencias);

    await expect(servicio.listarConversacion(7, { id_usuario: 12 })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  test('rechaza envios de usuarios no vinculados a la inscripcion', async () => {
    const dependencias = crearDependencias({
      usuarioRepository: {
        buscarPorId: jest.fn().mockResolvedValue({ id: 12, rol: 'estudiante' }),
      },
    });
    const servicio = crearServicioMensaje(dependencias);

    await expect(servicio.enviarMensaje(7, {
      id_usuario: 12,
      contenido: 'Hola',
    })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    expect(dependencias.mensajeRepository.crearMensaje).not.toHaveBeenCalled();
  });

  test('no permite enviar el destinatario desde el frontend', async () => {
    const dependencias = crearDependencias();
    const servicio = crearServicioMensaje(dependencias);

    await expect(servicio.enviarMensaje(7, {
      id_usuario: 9,
      id_destinatario: 12,
      contenido: 'Hola',
    })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(dependencias.mensajeRepository.crearMensaje).not.toHaveBeenCalled();
  });

  test('rechaza alias de remitente para evitar manipulacion desde el frontend', async () => {
    const dependencias = crearDependencias();
    const servicio = crearServicioMensaje(dependencias);

    await expect(servicio.enviarMensaje(7, {
      remitenteId: 9,
      contenido: 'Hola',
    })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(dependencias.mensajeRepository.crearMensaje).not.toHaveBeenCalled();
  });

  test('valida que el usuario asociado tenga el rol esperado en la inscripcion', async () => {
    const dependencias = crearDependencias({
      usuarioRepository: {
        buscarPorId: jest.fn().mockResolvedValue({ id: 9, rol: 'estudiante' }),
      },
    });
    const servicio = crearServicioMensaje(dependencias);

    await expect(servicio.enviarMensaje(7, {
      id_usuario: 9,
      contenido: 'Hola',
    })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});
