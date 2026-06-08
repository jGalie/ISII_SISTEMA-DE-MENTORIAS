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

const fechaFutura = new Date(Date.UTC(new Date().getUTCFullYear() + 1, 5, 10, 15, 30, 0));
const fechaFuturaIso = fechaFutura.toISOString();
const fechaFuturaSql = fechaFuturaIso.slice(0, 19).replace('T', ' ');

function datosClase(overrides = {}) {
  return {
    titulo: ' Clase de funciones ',
    descripcion: 'Introducción a funciones',
    fecha: fechaFuturaIso,
    modalidad: 'virtual',
    id_materia: 3,
    precio: 5000,
    cupo_maximo: 10,
    id_mentor: 7,
    ...overrides,
  };
}

describe('Clases - contrato crearClase', () => {
  test('crea una clase cuando los datos son validos, el usuario es mentor y la materia esta asociada', async () => {
    const claseCreada = {
      id: 45,
      titulo: 'Clase de funciones',
      descripcion: 'Introducción a funciones',
      fecha: fechaFuturaSql,
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
      fecha: fechaFuturaSql,
      modalidad: 'virtual',
      id_materia: 3,
      precio: 5000,
      ubicacion: null,
      cupo_maximo: 10,
      id_mentor: 7,
    });

    expect(resultado).toEqual(claseCreada);
  });

  test.each([
    ['titulo', { titulo: ' ' }],
    ['descripcion', { descripcion: ' ' }],
    ['fecha', { fecha: ' ' }],
    ['id_materia', { id_materia: undefined }],
  ])('rechaza la creacion de una clase cuando falta el dato obligatorio %s', async (campo, datosInvalidos) => {
    const dependencias = crearDependencias();
    const servicio = crearServicioClase(dependencias);

    await expect(servicio.crearClase(datosClase(datosInvalidos))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(dependencias.usuarioRepository.buscarPorId).not.toHaveBeenCalled();
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).not.toHaveBeenCalled();
    expect(dependencias.claseRepository.crearClase).not.toHaveBeenCalled();
  });

  test.each([
    ['fecha pasada', { fecha: '2020-01-01T10:00:00Z' }],
    ['titulo demasiado corto', { titulo: 'Mate' }],
    ['titulo demasiado largo', { titulo: 'T'.repeat(121) }],
    ['descripcion demasiado corta', { descripcion: 'Corta' }],
    ['descripcion demasiado larga', { descripcion: 'D'.repeat(1001) }],
  ])('rechaza la creacion de una clase con %s', async (caso, datosInvalidos) => {
    const dependencias = crearDependencias();
    const servicio = crearServicioClase(dependencias);

    await expect(servicio.crearClase(datosClase(datosInvalidos))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(dependencias.usuarioRepository.buscarPorId).not.toHaveBeenCalled();
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).not.toHaveBeenCalled();
    expect(dependencias.claseRepository.crearClase).not.toHaveBeenCalled();
  });

  test.each([
    ['id_mentor undefined', { id_mentor: undefined }],
    ['id_mentor cero', { id_mentor: 0 }],
    ['id_mentor no numerico', { id_mentor: 'abc' }],
  ])('rechaza la creacion de una clase cuando no se recibe un id_mentor valido: %s', async (caso, datosInvalidos) => {
    const dependencias = crearDependencias();
    const servicio = crearServicioClase(dependencias);

    await expect(servicio.crearClase(datosClase(datosInvalidos))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(dependencias.usuarioRepository.buscarPorId).not.toHaveBeenCalled();
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).not.toHaveBeenCalled();
    expect(dependencias.claseRepository.crearClase).not.toHaveBeenCalled();
  });

  test('rechaza la creacion de una clase cuando el usuario indicado no existe', async () => {
    const dependencias = crearDependencias({
      usuarioRepository: {
        buscarPorId: jest.fn().mockResolvedValue(null),
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
      titulo: 'Clase presencial de funciones',
      descripcion: 'Clase de apoyo',
      modalidad: 'presencial',
      ubicacion: ' ',
    }))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(dependencias.usuarioRepository.buscarPorId).not.toHaveBeenCalled();
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).not.toHaveBeenCalled();
    expect(dependencias.claseRepository.crearClase).not.toHaveBeenCalled();
  });

  test.each([
    ['precio no numerico', { precio: 'abc' }],
    ['precio negativo', { precio: -1 }],
  ])('rechaza la creacion de una clase cuando el precio es invalido: %s', async (caso, datosInvalidos) => {
    const dependencias = crearDependencias();
    const servicio = crearServicioClase(dependencias);

    await expect(servicio.crearClase(datosClase(datosInvalidos))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(dependencias.usuarioRepository.buscarPorId).not.toHaveBeenCalled();
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).not.toHaveBeenCalled();
    expect(dependencias.claseRepository.crearClase).not.toHaveBeenCalled();
  });

  test.each([
    ['cupo maximo cero', { cupo_maximo: 0 }],
    ['cupo maximo decimal', { cupo_maximo: 2.5 }],
    ['cupo maximo no numerico', { cupo_maximo: 'abc' }],
  ])('rechaza la creacion de una clase cuando el cupo maximo es invalido: %s', async (caso, datosInvalidos) => {
    const dependencias = crearDependencias();
    const servicio = crearServicioClase(dependencias);

    await expect(servicio.crearClase(datosClase(datosInvalidos))).rejects.toMatchObject({
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

  test('informa una falla tecnica si no se pudo registrar la clase', async () => {
    const dependencias = crearDependencias({
      claseRepository: {
        crearClase: jest.fn().mockRejectedValue(new Error('No se pudo registrar la clase')),
      },
    });

    const servicio = crearServicioClase(dependencias);

    await expect(servicio.crearClase(datosClase())).rejects.toThrow('No se pudo registrar la clase');

    expect(dependencias.usuarioRepository.buscarPorId).toHaveBeenCalledWith(7);
    expect(dependencias.mentorMateriaRepository.buscarAsociacion).toHaveBeenCalledWith(7, 3);
    expect(dependencias.claseRepository.crearClase).toHaveBeenCalled();
  });

  test.each([
    ['mentorId', { mentorId: 7 }],
    ['materiaId', { materiaId: 3 }],
  ])('rechaza el alias camelCase %s porque no pertenece al contrato de operacion', async (alias, campoInvalido) => {
    const dependencias = crearDependencias();
    const servicio = crearServicioClase(dependencias);

    await expect(servicio.crearClase(datosClase(campoInvalido))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(dependencias.claseRepository.crearClase).not.toHaveBeenCalled();
  });
});

describe('Clases - otros metodos del servicio', () => {
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
