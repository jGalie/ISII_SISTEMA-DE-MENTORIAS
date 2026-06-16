const { crearServicioValoracion } = require('../../src/services/valoracion.service');

function crearDependencias(overrides = {}) {
  return {
    valoracionRepository: {
      existeDeEstudianteEnClase: jest.fn().mockResolvedValue(false),
      crear: jest.fn().mockResolvedValue({
        id_valoracion: 7,
        id_clase: 1,
        id_estudiante: 6,
        estrellas: 5,
        comentario: '',
      }),
      ...overrides.valoracionRepository,
    },
    claseRepository: {
      buscarPorId: jest.fn().mockResolvedValue({
        id_clase: 1,
        id_mentor: 2,
      }),
      ...overrides.claseRepository,
    },
    usuarioRepository: {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 6,
        rol: 'estudiante',
      }),
      ...overrides.usuarioRepository,
    },
    inscripcionRepository: {
      buscarExistente: jest.fn().mockResolvedValue({
        id_inscripcion: 5,
        estado: 'aceptada',
      }),
      ...overrides.inscripcionRepository,
    },
  };
}

describe('Valoraciones - contrato del servicio', () => {
  test.each([
    ['claseId', { claseId: 1, id_estudiante: 6 }],
    ['estudianteId', { id_clase: 1, estudianteId: 6 }],
    ['mentorId', { id_clase: 1, id_estudiante: 6, mentorId: 2 }],
  ])('rechaza el alias camelCase %s', async (alias, datos) => {
    const dependencias = crearDependencias();
    const servicio = crearServicioValoracion(dependencias);

    await expect(servicio.crearValoracion({
      estrellas: 5,
      ...datos,
    })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(dependencias.usuarioRepository.buscarPorId).not.toHaveBeenCalled();
    expect(dependencias.claseRepository.buscarPorId).not.toHaveBeenCalled();
    expect(dependencias.valoracionRepository.crear).not.toHaveBeenCalled();
  });

  test('rechaza comentarios demasiado largos', async () => {
    const dependencias = crearDependencias();
    const servicio = crearServicioValoracion(dependencias);

    await expect(
      servicio.crearValoracion({
        id_clase: 1,
        id_estudiante: 6,
        estrellas: 5,
        comentario: 'C'.repeat(501),
      })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'El comentario de la valoracion no puede superar los 500 caracteres.',
    });

    expect(dependencias.usuarioRepository.buscarPorId).not.toHaveBeenCalled();
    expect(dependencias.claseRepository.buscarPorId).not.toHaveBeenCalled();
    expect(dependencias.valoracionRepository.crear).not.toHaveBeenCalled();
  });
});
