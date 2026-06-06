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
    titulo: ' Algebra inicial ',
    descripcion: 'Repaso de ecuaciones',
    fecha: '2026-06-10T15:30:00Z',
    modalidad: 'virtual',
    id_materia: 3,
    precio: 8500,
    cupo_maximo: 5,
    id_mentor: 7,
    ...overrides,
  };
}

describe('Clases', () => {
  test('crea una clase cuando el mentor y la materia asociada son validos', async () => {
    const claseCreada = {
      id: 45,
      titulo: 'Algebra inicial',
      id_mentor: 7,
      id_materia: 3,
    };
    const dependencias = crearDependencias({
      claseRepository: {
        crearClase: jest.fn().mockResolvedValue(claseCreada),
      },
    });
    const servicio = crearServicioClase(dependencias);

    const resultado = await servicio.crearClase(datosClase());

    expect(dependencias.usuarioRepository.buscarPorId).toHaveBeenCalledWith(7);
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).toHaveBeenCalledWith(7, 3);
    expect(dependencias.claseRepository.crearClase).toHaveBeenCalledWith({
      titulo: 'Algebra inicial',
      descripcion: 'Repaso de ecuaciones',
      fecha: '2026-06-10 15:30:00',
      modalidad: 'virtual',
      id_materia: 3,
      precio: 8500,
      ubicacion: null,
      cupo_maximo: 5,
      id_mentor: 7,
    });
    expect(resultado).toEqual(claseCreada);
  });

  test.each([
    ['mentorId', { mentorId: 7 }],
    ['materiaId', { materiaId: 3 }],
  ])('rechaza el alias camelCase %s', async (alias, campoInvalido) => {
    const dependencias = crearDependencias();
    const servicio = crearServicioClase(dependencias);

    await expect(servicio.crearClase(datosClase(campoInvalido))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(dependencias.claseRepository.crearClase).not.toHaveBeenCalled();
  });

  test('actualiza una clase con contrato snake_case', async () => {
    const claseExistente = {
      id: 45,
      id_mentor: 7,
      cupo_actual: 2,
    };
    const dependencias = crearDependencias({
      claseRepository: {
        buscarPorId: jest.fn().mockResolvedValue(claseExistente),
        actualizarClase: jest.fn().mockResolvedValue({ ...claseExistente, titulo: 'Algebra avanzada' }),
      },
    });
    const servicio = crearServicioClase(dependencias);

    const resultado = await servicio.actualizarClase(45, datosClase({
      titulo: 'Algebra avanzada',
    }));

    expect(dependencias.claseRepository.actualizarClase).toHaveBeenCalledWith(
      45,
      expect.objectContaining({
        titulo: 'Algebra avanzada',
        id_materia: 3,
        cupo_maximo: 5,
      })
    );
    expect(resultado.titulo).toBe('Algebra avanzada');
  });

  test('elimina una clase propia con id_mentor', async () => {
    const claseExistente = {
      id: 45,
      id_mentor: 7,
    };
    const dependencias = crearDependencias({
      claseRepository: {
        buscarPorId: jest.fn().mockResolvedValue(claseExistente),
        eliminarClase: jest.fn().mockResolvedValue(claseExistente),
      },
    });
    const servicio = crearServicioClase(dependencias);

    const resultado = await servicio.eliminarClase(45, { id_mentor: 7 });

    expect(dependencias.claseRepository.eliminarClase).toHaveBeenCalledWith(45);
    expect(resultado).toEqual(claseExistente);
  });

  test('rechaza mentorId al eliminar una clase', async () => {
    const dependencias = crearDependencias();
    const servicio = crearServicioClase(dependencias);

    await expect(servicio.eliminarClase(45, { mentorId: 7 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(dependencias.claseRepository.buscarPorId).not.toHaveBeenCalled();
  });

  test('lista clases generales y clases de un mentor', async () => {
    const dependencias = crearDependencias({
      claseRepository: {
        buscarTodas: jest.fn().mockResolvedValue([{ id: 1 }]),
        buscarPorMentor: jest.fn().mockResolvedValue([{ id: 2, id_mentor: 7 }]),
      },
    });
    const servicio = crearServicioClase(dependencias);

    await expect(servicio.listarClases({ id_materia: 3 })).resolves.toEqual([{ id: 1 }]);
    await expect(servicio.listarClasesPorMentor(7)).resolves.toEqual([{ id: 2, id_mentor: 7 }]);

    expect(dependencias.claseRepository.buscarTodas).toHaveBeenCalledWith({ id_materia: 3 });
    expect(dependencias.claseRepository.buscarPorMentor).toHaveBeenCalledWith(7);
  });

  test('rechaza materiaId como filtro de clases', async () => {
    const dependencias = crearDependencias();
    const servicio = crearServicioClase(dependencias);

    await expect(servicio.listarClases({ materiaId: 3 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(dependencias.claseRepository.buscarTodas).not.toHaveBeenCalled();
  });
});
