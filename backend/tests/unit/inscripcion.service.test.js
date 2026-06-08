const { crearServicioInscripcion } = require('../../src/services/inscripcion.service');

describe('Inscripciones: cambio de estado', () => {
  test('crea una solicitud con id_usuario e id_clase', async () => {
    const inscripcionCreada = {
      id: 30,
      id_inscripcion: 30,
      id_usuario: 8,
      id_clase: 12,
      estado: 'pendiente',
    };
    const inscripcionRepository = {
      buscarExistente: jest.fn().mockResolvedValue(null),
      crearInscripcion: jest.fn().mockResolvedValue(inscripcionCreada),
    };
    const claseRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 12,
        id_clase: 12,
        id_mentor: 4,
        completa: false,
      }),
    };
    const usuarioRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 8,
        rol: 'estudiante',
      }),
    };
    const servicio = crearServicioInscripcion({
      inscripcionRepository,
      claseRepository,
      usuarioRepository,
    });

    const resultado = await servicio.solicitarInscripcion({
      id_usuario: 8,
      id_clase: 12,
    });

    expect(usuarioRepository.buscarPorId).toHaveBeenCalledWith(8);
    expect(claseRepository.buscarPorId).toHaveBeenCalledWith(12);
    expect(inscripcionRepository.buscarExistente).toHaveBeenCalledWith(8, 12);
    expect(inscripcionRepository.crearInscripcion).toHaveBeenCalledWith({
      id_usuario: 8,
      id_clase: 12,
      estado: 'pendiente',
    });
    expect(resultado).toEqual(inscripcionCreada);
  });

  test.each([
    ['usuarioId', { usuarioId: 8, id_clase: 12 }],
    ['claseId', { id_usuario: 8, claseId: 12 }],
  ])('rechaza el alias camelCase %s al solicitar una inscripcion', async (alias, solicitud) => {
    const inscripcionRepository = {
      buscarExistente: jest.fn(),
      crearInscripcion: jest.fn(),
    };
    const claseRepository = {
      buscarPorId: jest.fn(),
    };
    const usuarioRepository = {
      buscarPorId: jest.fn(),
    };
    const servicio = crearServicioInscripcion({
      inscripcionRepository,
      claseRepository,
      usuarioRepository,
    });

    await expect(servicio.solicitarInscripcion(solicitud)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(usuarioRepository.buscarPorId).not.toHaveBeenCalled();
  });

  test('consulta las inscripciones de un estudiante valido', async () => {
    const inscripciones = [
      {
        id: 31,
        id_inscripcion: 31,
        id_usuario: 8,
        id_clase: 12,
        estado: 'aceptada',
      },
    ];

    const inscripcionRepository = {
      consultarInscripcionesDelEstudiante: jest.fn().mockResolvedValue(inscripciones),
    };

    const claseRepository = {};

    const usuarioRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 8,
        rol: 'estudiante',
      }),
    };

    const servicio = crearServicioInscripcion({
      inscripcionRepository,
      claseRepository,
      usuarioRepository,
    });

    const resultado = await servicio.buscarInscripcionesDelEstudiante(8);

    expect(usuarioRepository.buscarPorId).toHaveBeenCalledWith(8);
    expect(inscripcionRepository.consultarInscripcionesDelEstudiante).toHaveBeenCalledWith(8);
    expect(resultado).toEqual(inscripciones);
  });

  test('rechaza consultar inscripciones cuando el usuario no es estudiante', async () => {
    const inscripcionRepository = {
      consultarInscripcionesDelEstudiante: jest.fn(),
    };

    const claseRepository = {};

    const usuarioRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 4,
        rol: 'mentor',
      }),
    };

    const servicio = crearServicioInscripcion({
      inscripcionRepository,
      claseRepository,
      usuarioRepository,
    });

    await expect(servicio.buscarInscripcionesDelEstudiante(4)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(usuarioRepository.buscarPorId).toHaveBeenCalledWith(4);
    expect(inscripcionRepository.consultarInscripcionesDelEstudiante).not.toHaveBeenCalled();
  });

  test('incrementa el cupo al aceptar una inscripcion', async () => {
    const inscripcionAceptada = {
      id: 21,
      id_clase: 9,
      id_mentor: 4,
      estado: 'aceptada',
    };
    const inscripcionRepository = {
      obtenerPorId: jest.fn().mockResolvedValue({
        id: 21,
        id_clase: 9,
        id_mentor: 4,
        estado: 'pendiente',
      }),
      cambiarEstadoAceptada: jest.fn().mockResolvedValue(inscripcionAceptada),
    };
    const claseRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 9,
        completa: false,
      }),
      incrementarCupoActual: jest.fn().mockResolvedValue({
        id: 9,
        cupoActual: 1,
      }),
    };
    const usuarioRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 4,
        rol: 'mentor',
      }),
    };
    const servicio = crearServicioInscripcion({
      inscripcionRepository,
      claseRepository,
      usuarioRepository,
    });

    const resultado = await servicio.cambiarEstadoInscripcion(21, {
      estado: 'aceptada',
      id_mentor: 4,
    });

    expect(inscripcionRepository.obtenerPorId).toHaveBeenCalledWith(21);
    expect(usuarioRepository.buscarPorId).toHaveBeenCalledWith(4);
    expect(claseRepository.buscarPorId).toHaveBeenCalledWith(9);
    expect(claseRepository.incrementarCupoActual).toHaveBeenCalledWith(9);
    expect(inscripcionRepository.cambiarEstadoAceptada).toHaveBeenCalledWith(21);
    expect(resultado).toEqual(inscripcionAceptada);
  });

  test('notifica el cambio de estado cuando acepta una inscripcion', async () => {
    const inscripcionAceptada = {
      id_inscripcion: 21,
      id_usuario: 8,
      id_clase: 9,
      id_mentor: 4,
      estado: 'aceptada',
      claseTitulo: 'Algebra inicial',
    };
    const inscripcionRepository = {
      obtenerPorId: jest.fn().mockResolvedValue({
        id_inscripcion: 21,
        id_usuario: 8,
        id_clase: 9,
        id_mentor: 4,
        estado: 'pendiente',
      }),
      cambiarEstadoAceptada: jest.fn().mockResolvedValue(inscripcionAceptada),
    };
    const claseRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 9,
        completa: false,
      }),
      incrementarCupoActual: jest.fn().mockResolvedValue({
        id: 9,
        cupoActual: 1,
      }),
    };
    const usuarioRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 4,
        rol: 'mentor',
      }),
    };
    const inscripcionEventPublisher = {
      notificarCambioEstado: jest.fn().mockResolvedValue(undefined),
    };
    const servicio = crearServicioInscripcion({
      inscripcionRepository,
      claseRepository,
      usuarioRepository,
      inscripcionEventPublisher,
    });

    await servicio.cambiarEstadoInscripcion(21, {
      estado: 'aceptada',
      id_mentor: 4,
    });

    expect(inscripcionEventPublisher.notificarCambioEstado).toHaveBeenCalledWith({
      tipo: 'inscripcion.estado_cambiado',
      inscripcion: inscripcionAceptada,
    });
  });

  test('decrementa el cupo al rechazar una inscripcion aceptada', async () => {
    const inscripcionRechazada = {
      id: 22,
      id_clase: 10,
      id_mentor: 5,
      estado: 'rechazada',
    };
    const inscripcionRepository = {
      obtenerPorId: jest.fn().mockResolvedValue({
        id: 22,
        id_clase: 10,
        id_mentor: 5,
        estado: 'aceptada',
      }),
      cambiarEstadoRechazada: jest.fn().mockResolvedValue(inscripcionRechazada),
    };
    const claseRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 10,
        completa: false,
      }),
      decrementarCupoActual: jest.fn().mockResolvedValue({
        id: 10,
        cupoActual: 1,
      }),
    };
    const usuarioRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 5,
        rol: 'mentor',
      }),
    };
    const servicio = crearServicioInscripcion({
      inscripcionRepository,
      claseRepository,
      usuarioRepository,
    });

    const resultado = await servicio.cambiarEstadoInscripcion(22, {
      estado: 'rechazada',
      id_mentor: 5,
    });

    expect(inscripcionRepository.obtenerPorId).toHaveBeenCalledWith(22);
    expect(usuarioRepository.buscarPorId).toHaveBeenCalledWith(5);
    expect(claseRepository.buscarPorId).toHaveBeenCalledWith(10);
    expect(claseRepository.decrementarCupoActual).toHaveBeenCalledWith(10);
    expect(inscripcionRepository.cambiarEstadoRechazada).toHaveBeenCalledWith(22);
    expect(resultado).toEqual(inscripcionRechazada);
  });

  test('notifica el cambio de estado cuando rechaza una inscripcion', async () => {
    const inscripcionRechazada = {
      id_inscripcion: 22,
      id_usuario: 8,
      id_clase: 10,
      id_mentor: 5,
      estado: 'rechazada',
      claseTitulo: 'Bases de datos',
    };
    const inscripcionRepository = {
      obtenerPorId: jest.fn().mockResolvedValue({
        id_inscripcion: 22,
        id_usuario: 8,
        id_clase: 10,
        id_mentor: 5,
        estado: 'pendiente',
      }),
      cambiarEstadoRechazada: jest.fn().mockResolvedValue(inscripcionRechazada),
    };
    const claseRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 10,
        completa: false,
      }),
      decrementarCupoActual: jest.fn(),
    };
    const usuarioRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 5,
        rol: 'mentor',
      }),
    };
    const inscripcionEventPublisher = {
      notificarCambioEstado: jest.fn().mockResolvedValue(undefined),
    };
    const servicio = crearServicioInscripcion({
      inscripcionRepository,
      claseRepository,
      usuarioRepository,
      inscripcionEventPublisher,
    });

    await servicio.cambiarEstadoInscripcion(22, {
      estado: 'rechazada',
      id_mentor: 5,
    });

    expect(inscripcionEventPublisher.notificarCambioEstado).toHaveBeenCalledWith({
      tipo: 'inscripcion.estado_cambiado',
      inscripcion: inscripcionRechazada,
    });
  });

  test('no permite aceptar una inscripcion rechazada', async () => {
    const inscripcionRepository = {
      obtenerPorId: jest.fn().mockResolvedValue({
        id: 23,
        id_clase: 10,
        id_mentor: 5,
        estado: 'rechazada',
      }),
      cambiarEstadoAceptada: jest.fn(),
    };
    const claseRepository = {
      buscarPorId: jest.fn(),
      incrementarCupoActual: jest.fn(),
    };
    const usuarioRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 5,
        rol: 'mentor',
      }),
    };
    const servicio = crearServicioInscripcion({
      inscripcionRepository,
      claseRepository,
      usuarioRepository,
    });

    await expect(
      servicio.cambiarEstadoInscripcion(23, { estado: 'aceptada', id_mentor: 5 })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Solo se pueden aceptar inscripciones pendientes.',
    });
    expect(claseRepository.incrementarCupoActual).not.toHaveBeenCalled();
    expect(inscripcionRepository.cambiarEstadoAceptada).not.toHaveBeenCalled();
  });

  test('no permite volver una inscripcion a pendiente desde el endpoint de estado', async () => {
    const inscripcionRepository = {
      obtenerPorId: jest.fn(),
      cambiarEstadoPendiente: jest.fn(),
    };
    const claseRepository = {};
    const usuarioRepository = {};
    const servicio = crearServicioInscripcion({
      inscripcionRepository,
      claseRepository,
      usuarioRepository,
    });

    await expect(
      servicio.cambiarEstadoInscripcion(23, { estado: 'pendiente', id_mentor: 5 })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Estado de inscripcion invalido.',
    });
    expect(inscripcionRepository.obtenerPorId).not.toHaveBeenCalled();
  });

  test('rechaza gestionar una inscripcion si el cupo actual ya supera el maximo', async () => {
    const inscripcionRepository = {
      obtenerPorId: jest.fn().mockResolvedValue({
        id: 24,
        id_clase: 11,
        id_mentor: 5,
        estado: 'pendiente',
      }),
      cambiarEstadoAceptada: jest.fn(),
    };
    const claseRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 11,
        cupo_actual: 6,
        cupo_maximo: 5,
        completa: false,
      }),
      incrementarCupoActual: jest.fn(),
    };
    const usuarioRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 5,
        rol: 'mentor',
      }),
    };
    const servicio = crearServicioInscripcion({
      inscripcionRepository,
      claseRepository,
      usuarioRepository,
    });

    await expect(
      servicio.cambiarEstadoInscripcion(24, { estado: 'aceptada', id_mentor: 5 })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'El cupo actual no puede superar el cupo maximo.',
    });
    expect(claseRepository.incrementarCupoActual).not.toHaveBeenCalled();
    expect(inscripcionRepository.cambiarEstadoAceptada).not.toHaveBeenCalled();
  });
});
