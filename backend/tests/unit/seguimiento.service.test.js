const { crearServicioSeguimiento } = require('../../src/services/seguimiento.service');

function crearDependencias({
  inscripcion = {
    id_inscripcion: 9,
    id_usuario: 8,
    id_mentor: 3,
    estado: 'aceptada',
  },
  actores = {
    3: { id: 3, rol: 'mentor' },
    4: { id: 4, rol: 'mentor' },
    8: { id: 8, rol: 'estudiante' },
    10: { id: 10, rol: 'estudiante' },
  },
} = {}) {
  const seguimientoCreado = {
    id_seguimiento: 2,
    id_inscripcion: 9,
    notas: 'Buen ritmo de trabajo',
    fecha_seguimiento: '2026-06-02T12:00:00.000Z',
  };
  const seguimientoRepository = {
    crear: jest.fn().mockResolvedValue(seguimientoCreado),
    buscarPorInscripcion: jest.fn().mockResolvedValue([seguimientoCreado]),
  };
  const inscripcionRepository = {
    obtenerPorId: jest.fn().mockResolvedValue(inscripcion),
  };
  const usuarioRepository = {
    buscarPorId: jest.fn((id) => Promise.resolve(actores[id] || null)),
  };

  return {
    seguimientoRepository,
    inscripcionRepository,
    usuarioRepository,
    servicio: crearServicioSeguimiento({
      seguimientoRepository,
      inscripcionRepository,
      usuarioRepository,
    }),
  };
}

describe('Seguimiento academico autorizado', () => {
  test('mentor duenio crea seguimiento', async () => {
    const { servicio, seguimientoRepository } = crearDependencias();

    await servicio.registrarSeguimiento({
      id_inscripcion: 9,
      id_usuario: 3,
      notas: 'Buen ritmo de trabajo',
    });

    expect(seguimientoRepository.crear).toHaveBeenCalledWith({
      id_inscripcion: 9,
      notas: 'Buen ritmo de trabajo',
      fecha_seguimiento: undefined,
    });
  });

  test('mentor ajeno no crea seguimiento', async () => {
    const { servicio, seguimientoRepository } = crearDependencias();

    await expect(
      servicio.registrarSeguimiento({
        id_inscripcion: 9,
        id_usuario: 4,
        notas: 'Intento ajeno',
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(seguimientoRepository.crear).not.toHaveBeenCalled();
  });

  test('estudiante no crea seguimiento', async () => {
    const { servicio, seguimientoRepository } = crearDependencias();

    await expect(
      servicio.registrarSeguimiento({
        id_inscripcion: 9,
        id_usuario: 8,
        notas: 'Intento estudiante',
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(seguimientoRepository.crear).not.toHaveBeenCalled();
  });

  test('estudiante inscripto consulta seguimiento', async () => {
    const { servicio, seguimientoRepository } = crearDependencias();

    const resultado = await servicio.listarSeguimientosPorInscripcion(9, {
      id_usuario: 8,
    });

    expect(seguimientoRepository.buscarPorInscripcion).toHaveBeenCalledWith(9);
    expect(resultado).toHaveLength(1);
  });

  test('usuario ajeno no consulta seguimiento', async () => {
    const { servicio, seguimientoRepository } = crearDependencias();

    await expect(
      servicio.listarSeguimientosPorInscripcion(9, { id_usuario: 10 })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(seguimientoRepository.buscarPorInscripcion).not.toHaveBeenCalled();
  });

  test('rechaza seguimiento para una inscripcion no aceptada', async () => {
    const { servicio } = crearDependencias({
      inscripcion: {
        id_inscripcion: 9,
        id_usuario: 8,
        id_mentor: 3,
        estado: 'pendiente',
      },
    });

    await expect(
      servicio.registrarSeguimiento({
        id_inscripcion: 9,
        id_usuario: 3,
        notas: 'Todavia no corresponde',
      })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test.each([
    ['inscripcionId', { inscripcionId: 9 }],
    ['usuarioId', { usuarioId: 3 }],
    ['fechaSeguimiento', { fechaSeguimiento: '2026-06-02T12:00:00.000Z' }],
  ])('rechaza el alias camelCase %s', async (alias, campoInvalido) => {
    const { servicio, seguimientoRepository } = crearDependencias();

    await expect(
      servicio.registrarSeguimiento({
        id_inscripcion: 9,
        id_usuario: 3,
        notas: 'Buen ritmo de trabajo',
        ...campoInvalido,
      })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(seguimientoRepository.crear).not.toHaveBeenCalled();
  });
});
