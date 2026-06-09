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
    ubicacion: null,
    ...overrides,
  };
}

describe('Crear clase', () => {
  test('crea una clase cuando los datos son validos, el usuario es mentor y la materia esta asociada', async () => {
    const claseCreada = {
      id: 45,
      titulo: 'Clase de funciones',
      descripcion: 'Introducción a funciones',
      fecha: '2026-06-10 15:30:00',
      modalidad: 'virtual',
      id_mentor: 7,
      id_materia: 3,
      precio: 5000,
      ubicacion: null,
      cupo_maximo: 10,
      cupo_actual: 0,
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
      titulo: 'Clase de funciones',
      descripcion: 'Introducción a funciones',
      fecha: '2026-06-10 15:30:00',
      modalidad: 'virtual',
      id_materia: 3,
      precio: 5000,
      ubicacion: null,
      cupo_maximo: 10,
      id_mentor: 7,
    });

    expect(resultado).toEqual(claseCreada);
  });

  test('rechaza la creacion de una clase cuando no se recibe un id_mentor valido', async () => {
    const dependencias = crearDependencias();
    const servicio = crearServicioClase(dependencias);

    await expect(servicio.crearClase(datosClase({
      id_mentor: null,
    }))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(dependencias.usuarioRepository.buscarPorId).not.toHaveBeenCalled();
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).not.toHaveBeenCalled();
    expect(dependencias.claseRepository.crearClase).not.toHaveBeenCalled();
  });

  test('rechaza la creacion de una clase cuando falta el titulo', async () => {
    const dependencias = crearDependencias();
    const servicio = crearServicioClase(dependencias);

    await expect(servicio.crearClase(datosClase({
      titulo: ' ',
    }))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(dependencias.usuarioRepository.buscarPorId).not.toHaveBeenCalled();
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).not.toHaveBeenCalled();
    expect(dependencias.claseRepository.crearClase).not.toHaveBeenCalled();
  });

  test('rechaza la creacion de una clase cuando el usuario no tiene rol mentor', async () => {
    const dependencias = crearDependencias({
      usuarioRepository: {
        buscarPorId: jest.fn().mockResolvedValue({
          id: 7,
          rol: 'estudiante',
        }),
      },
    });

    const servicio = crearServicioClase(dependencias);

    await expect(servicio.crearClase(datosClase())).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });

    expect(dependencias.usuarioRepository.buscarPorId).toHaveBeenCalledWith(7);
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).not.toHaveBeenCalled();
    expect(dependencias.claseRepository.crearClase).not.toHaveBeenCalled();
  });

  test('rechaza la creacion de una clase cuando la modalidad es invalida', async () => {
    const dependencias = crearDependencias();
    const servicio = crearServicioClase(dependencias);

    await expect(servicio.crearClase(datosClase({
      modalidad: 'hibrida',
    }))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(dependencias.usuarioRepository.buscarPorId).not.toHaveBeenCalled();
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).not.toHaveBeenCalled();
    expect(dependencias.claseRepository.crearClase).not.toHaveBeenCalled();
  });

  test('rechaza la creacion de una clase presencial sin ubicacion', async () => {
    const dependencias = crearDependencias();
    const servicio = crearServicioClase(dependencias);

    await expect(servicio.crearClase(datosClase({
      modalidad: 'presencial',
      ubicacion: ' ',
    }))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(dependencias.usuarioRepository.buscarPorId).not.toHaveBeenCalled();
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).not.toHaveBeenCalled();
    expect(dependencias.claseRepository.crearClase).not.toHaveBeenCalled();
  });

  test('rechaza la creacion de una clase cuando el precio es invalido', async () => {
    const preciosInvalidos = [-1, 'abc'];

    for (const precioInvalido of preciosInvalidos) {
      const dependencias = crearDependencias();
      const servicio = crearServicioClase(dependencias);

      await expect(servicio.crearClase(datosClase({
        precio: precioInvalido,
      }))).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });

      expect(dependencias.usuarioRepository.buscarPorId).not.toHaveBeenCalled();
      expect(dependencias.mentorMateriaRepository.buscarAsociacion).not.toHaveBeenCalled();
      expect(dependencias.claseRepository.crearClase).not.toHaveBeenCalled();
    }
  });

  test('rechaza la creacion de una clase cuando el cupo maximo es invalido', async () => {
    const dependencias = crearDependencias();
    const servicio = crearServicioClase(dependencias);

    await expect(servicio.crearClase(datosClase({
      cupo_maximo: 0,
    }))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(dependencias.usuarioRepository.buscarPorId).not.toHaveBeenCalled();
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).not.toHaveBeenCalled();
    expect(dependencias.claseRepository.crearClase).not.toHaveBeenCalled();
  });

  test('rechaza la creacion de una clase cuando la materia no esta asociada al mentor', async () => {
    const dependencias = crearDependencias({
      mentorMateriaRepository: {
        buscarAsociacion: jest.fn().mockResolvedValue(null),
      },
    });

    const servicio = crearServicioClase(dependencias);

    await expect(servicio.crearClase(datosClase())).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });

    expect(dependencias.usuarioRepository.buscarPorId).toHaveBeenCalledWith(7);
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).toHaveBeenCalledWith(7, 3);
    expect(dependencias.claseRepository.crearClase).not.toHaveBeenCalled();
  });
});