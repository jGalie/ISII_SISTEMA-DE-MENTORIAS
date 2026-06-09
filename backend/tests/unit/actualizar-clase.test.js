const { crearServicioClase } = require('../../src/services/clase.service');

function crearDependencias(overrides = {}) {
  return {
    claseRepository: {
      crearClase: jest.fn(),
      buscarTodas: jest.fn().mockResolvedValue([]),
      buscarPorId: jest.fn(),
      buscarPorMentor: jest.fn().mockResolvedValue([]),
      actualizarClase: jest.fn(),
      eliminarClase: jest.fn(),
      ...overrides.claseRepository,
    },
    usuarioRepository: {
      buscarPorId: jest.fn().mockResolvedValue({ id: 7, rol: 'mentor' }),
      ...overrides.usuarioRepository,
    },
    mentorMateriaRepository: {
      buscarAsociacion: jest.fn().mockResolvedValue({
        id_mentor: 7,
        id_materia: 3,
      }),
      ...overrides.mentorMateriaRepository,
    },
  };
}

function datosClase(overrides = {}) {
  return {
    titulo: ' Clase de funciones ',
    descripcion: 'Introducción a funciones',
    fecha: '2026-06-10T15:30:00Z',
    modalidad: 'virtual',
    id_materia: 3,
    precio: 5000,
    cupo_maximo: 10,
    id_mentor: 7,
    ...overrides,
  };
}

describe('Actualización de clase', () => {
  test('modifica una clase existente con datos validos', async () => {
    const claseExistente = {
      id: 45,
      id_mentor: 7,
      cupo_actual: 2,
    };

    const dependencias = crearDependencias({
      claseRepository: {
        buscarPorId: jest.fn().mockResolvedValue(claseExistente),
        actualizarClase: jest.fn().mockResolvedValue({
          ...claseExistente,
          titulo: 'Algebra avanzada',
        }),
      },
    });

    const servicio = crearServicioClase(dependencias);

    const resultado = await servicio.actualizarClase(45, datosClase({
      titulo: 'Algebra avanzada',
    }));

    expect(dependencias.claseRepository.buscarPorId).toHaveBeenCalledWith(45);
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).toHaveBeenCalledWith(7, 3);

    expect(dependencias.claseRepository.actualizarClase).toHaveBeenCalledWith(
      45,
      expect.objectContaining({
        titulo: 'Algebra avanzada',
        id_materia: 3,
        cupo_maximo: 10,
      })
    );

    expect(resultado.titulo).toBe('Algebra avanzada');
  });

  test('rechaza modificar una clase que no pertenece al mentor', async () => {
    const claseExistente = {
      id: 45,
      id_mentor: 9,
      cupo_actual: 2,
    };

    const dependencias = crearDependencias({
      claseRepository: {
        buscarPorId: jest.fn().mockResolvedValue(claseExistente),
        actualizarClase: jest.fn(),
      },
    });

    const servicio = crearServicioClase(dependencias);

    await expect(servicio.actualizarClase(45, datosClase({
      id_mentor: 7,
      titulo: 'Algebra avanzada',
    }))).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });

    expect(dependencias.claseRepository.buscarPorId).toHaveBeenCalledWith(45);
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).not.toHaveBeenCalled();
    expect(dependencias.claseRepository.actualizarClase).not.toHaveBeenCalled();
  });
});