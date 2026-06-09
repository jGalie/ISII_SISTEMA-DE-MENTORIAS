const { crearServicioMensaje } = require('../../src/services/mensaje.service');

function crearDependencias(overrides = {}) {
  return {
    mensajeRepository: {
      crear: jest.fn(),
      buscarPorInscripcion: jest.fn().mockResolvedValue([]),
      ...overrides.mensajeRepository,
    },
    inscripcionRepository: {
      obtenerPorId: jest.fn().mockResolvedValue({
        id_inscripcion: 7,
        id_usuario: 3,
        id_mentor: 9,
      }),
      ...overrides.inscripcionRepository,
    },
    usuarioRepository: {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 9,
        rol: 'mentor',
      }),
      ...overrides.usuarioRepository,
    },
  };
}

function datosMensaje(overrides = {}) {
  return {
    id_inscripcion: 7,
    id_usuario: 9,
    contenido: 'Cual es tu nivel previo?',
    ...overrides,
  };
}

describe('Enviar mensaje', () => {
  test('envia un mensaje cuando el mentor pertenece a la inscripcion', async () => {
    const mensajeCreado = {
      id_mensaje: 15,
      id_inscripcion: 7,
      id_remitente: 9,
      id_destinatario: 3,
      contenido: 'Cual es tu nivel previo?',
    };

    const dependencias = crearDependencias({
      mensajeRepository: {
        crear: jest.fn().mockResolvedValue(mensajeCreado),
      },
    });

    const servicio = crearServicioMensaje(dependencias);

    const resultado = await servicio.enviarMensaje(datosMensaje());

    expect(dependencias.inscripcionRepository.obtenerPorId).toHaveBeenCalledWith(7);
    expect(dependencias.usuarioRepository.buscarPorId).toHaveBeenCalledWith(9);

    expect(dependencias.mensajeRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        id_inscripcion: 7,
        id_remitente: 9,
        id_destinatario: 3,
        contenido: 'Cual es tu nivel previo?',
      })
    );

    expect(resultado).toEqual(mensajeCreado);
  });

  test('rechaza mensajes con contenido vacio', async () => {
    const dependencias = crearDependencias();
    const servicio = crearServicioMensaje(dependencias);

    await expect(
      servicio.enviarMensaje(datosMensaje({
        contenido: ' ',
      }))
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(dependencias.mensajeRepository.crear).not.toHaveBeenCalled();
  });

  test('rechaza mensajes de usuarios que no pertenecen a la inscripcion', async () => {
    const dependencias = crearDependencias({
      usuarioRepository: {
        buscarPorId: jest.fn().mockResolvedValue({
          id: 12,
          rol: 'estudiante',
        }),
      },
    });

    const servicio = crearServicioMensaje(dependencias);

    await expect(
      servicio.enviarMensaje(datosMensaje({
        id_usuario: 12,
      }))
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });

    expect(dependencias.mensajeRepository.crear).not.toHaveBeenCalled();
  });

  test('rechaza mensajes con destinatario definido manualmente', async () => {
    const dependencias = crearDependencias();
    const servicio = crearServicioMensaje(dependencias);

    await expect(
      servicio.enviarMensaje(datosMensaje({
        id_destinatario: 12,
      }))
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(dependencias.mensajeRepository.crear).not.toHaveBeenCalled();
  });

  test('rechaza campos que no pertenecen al contrato del servicio', async () => {
    const camposInvalidos = [
      { usuarioId: 9 },
      { remitenteId: 9 },
      { destinatarioId: 3 },
      { inscripcionId: 7 },
      { fechaEnvio: '2026-06-10T15:30:00Z' },
    ];

    for (const campoInvalido of camposInvalidos) {
      const dependencias = crearDependencias();
      const servicio = crearServicioMensaje(dependencias);

      await expect(
        servicio.enviarMensaje(datosMensaje(campoInvalido))
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });

      expect(dependencias.mensajeRepository.crear).not.toHaveBeenCalled();
    }
  });

  test('rechaza el envio cuando el rol del usuario no coincide con su participacion en la inscripcion', async () => {
    const dependencias = crearDependencias({
      usuarioRepository: {
        buscarPorId: jest.fn().mockResolvedValue({
          id: 9,
          rol: 'estudiante',
        }),
      },
    });

    const servicio = crearServicioMensaje(dependencias);

    await expect(
      servicio.enviarMensaje(datosMensaje())
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });

    expect(dependencias.mensajeRepository.crear).not.toHaveBeenCalled();
  });
});