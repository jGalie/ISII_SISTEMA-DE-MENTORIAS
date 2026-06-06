const { crearServicioSeguimiento } = require('../../src/services/seguimiento.service');

describe('Seguimiento academico', () => {
  test('lista observaciones por inscripcion aceptada', async () => {
    const seguimientoRepository = {
      buscarPorInscripcion: jest.fn().mockResolvedValue([
        {
          id_seguimiento: 1,
          id_inscripcion: 7,
          notas: 'Avance inicial',
          fecha_seguimiento: '2026-06-01T12:00:00.000Z',
        },
      ]),
    };
    const inscripcionRepository = {
      obtenerPorId: jest.fn().mockResolvedValue({
        id: 7,
        estado: 'aceptada',
      }),
    };
    const servicio = crearServicioSeguimiento({
      seguimientoRepository,
      inscripcionRepository,
    });

    const resultado = await servicio.listarSeguimientosPorInscripcion(7);

    expect(inscripcionRepository.obtenerPorId).toHaveBeenCalledWith(7);
    expect(seguimientoRepository.buscarPorInscripcion).toHaveBeenCalledWith(7);
    expect(resultado).toHaveLength(1);
  });

  test('rechaza consultas de inscripciones no aceptadas', async () => {
    const seguimientoRepository = {
      buscarPorInscripcion: jest.fn(),
    };
    const inscripcionRepository = {
      obtenerPorId: jest.fn().mockResolvedValue({
        id: 8,
        estado: 'pendiente',
      }),
    };
    const servicio = crearServicioSeguimiento({
      seguimientoRepository,
      inscripcionRepository,
    });

    await expect(servicio.listarSeguimientosPorInscripcion(8)).rejects.toThrow(
      'El seguimiento academico solo esta disponible para inscripciones aceptadas'
    );
    expect(seguimientoRepository.buscarPorInscripcion).not.toHaveBeenCalled();
  });

  test('registra una observacion en una inscripcion aceptada', async () => {
    const seguimientoCreado = {
      id_seguimiento: 2,
      id_inscripcion: 9,
      notas: 'Buen ritmo de trabajo',
      fecha_seguimiento: '2026-06-02T12:00:00.000Z',
    };
    const seguimientoRepository = {
      crear: jest.fn().mockResolvedValue(seguimientoCreado),
    };
    const inscripcionRepository = {
      obtenerPorId: jest.fn().mockResolvedValue({
        id: 9,
        estado: 'aceptada',
      }),
    };
    const servicio = crearServicioSeguimiento({
      seguimientoRepository,
      inscripcionRepository,
    });

    const resultado = await servicio.registrarSeguimiento({
      id_inscripcion: 9,
      notas: 'Buen ritmo de trabajo',
    });

    expect(seguimientoRepository.crear).toHaveBeenCalledWith({
      id_inscripcion: 9,
      notas: 'Buen ritmo de trabajo',
      fecha_seguimiento: undefined,
    });
    expect(resultado).toEqual(seguimientoCreado);
  });
});
