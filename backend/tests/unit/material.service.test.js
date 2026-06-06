const { crearServicioMaterial } = require('../../src/services/material.service');

function crearDependencias({
  clase = { id_clase: 3, id_mentor: 5 },
  inscripciones = {},
  materiales = [],
  actores = {
    5: { id: 5, rol: 'mentor' },
    6: { id: 6, rol: 'mentor' },
    8: { id: 8, rol: 'estudiante' },
    9: { id: 9, rol: 'estudiante' },
  },
} = {}) {
  const materialCreado = {
    id_material: 10,
    id_clase: 3,
    titulo: 'Guia de estudio',
    url: 'https://example.com/guia.pdf',
    fecha_creacion: '2026-06-06T12:00:00.000Z',
  };
  const materialRepository = {
    crear: jest.fn().mockResolvedValue(materialCreado),
    buscarPorClase: jest.fn().mockResolvedValue(materiales),
  };
  const claseRepository = {
    buscarPorId: jest.fn().mockResolvedValue(clase),
  };
  const inscripcionRepository = {
    buscarExistente: jest.fn((id_usuario, id_clase) =>
      Promise.resolve(inscripciones[`${id_usuario}:${id_clase}`] || null)
    ),
  };
  const usuarioRepository = {
    buscarPorId: jest.fn((id) => Promise.resolve(actores[id] || null)),
  };

  return {
    materialRepository,
    claseRepository,
    inscripcionRepository,
    usuarioRepository,
    servicio: crearServicioMaterial({
      materialRepository,
      claseRepository,
      inscripcionRepository,
      usuarioRepository,
    }),
  };
}

function materialValido(id_usuario) {
  return {
    id_clase: 3,
    id_usuario,
    titulo: 'Guia de estudio',
    url: 'https://example.com/guia.pdf',
  };
}

describe('Materiales autorizados', () => {
  test('mentor duenio crea material', async () => {
    const { servicio, materialRepository } = crearDependencias();

    const resultado = await servicio.crearMaterial(materialValido(5));

    expect(materialRepository.crear).toHaveBeenCalledWith({
      id_clase: 3,
      titulo: 'Guia de estudio',
      url: 'https://example.com/guia.pdf',
    });
    expect(resultado.id_material).toBe(10);
  });

  test('mentor ajeno no crea material', async () => {
    const { servicio, materialRepository } = crearDependencias();

    await expect(servicio.crearMaterial(materialValido(6))).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    expect(materialRepository.crear).not.toHaveBeenCalled();
  });

  test('estudiante no crea material', async () => {
    const { servicio, materialRepository } = crearDependencias();

    await expect(servicio.crearMaterial(materialValido(8))).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    expect(materialRepository.crear).not.toHaveBeenCalled();
  });

  test('estudiante aceptado consulta material', async () => {
    const materiales = [{ id_material: 10, id_clase: 3 }];
    const { servicio, materialRepository } = crearDependencias({
      materiales,
      inscripciones: {
        '8:3': { id_inscripcion: 20, id_usuario: 8, id_clase: 3, estado: 'aceptada' },
      },
    });

    const resultado = await servicio.listarMaterialesPorClase(3, { id_usuario: 8 });

    expect(materialRepository.buscarPorClase).toHaveBeenCalledWith(3);
    expect(resultado).toEqual(materiales);
  });

  test('usuario ajeno no consulta material', async () => {
    const { servicio, materialRepository } = crearDependencias();

    await expect(
      servicio.listarMaterialesPorClase(3, { id_usuario: 9 })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(materialRepository.buscarPorClase).not.toHaveBeenCalled();
  });

  test.each([
    ['id_clase', { id_usuario: 5, titulo: 'Guia', url: 'https://example.com/guia.pdf' }],
    ['id_usuario', { id_clase: 3, titulo: 'Guia', url: 'https://example.com/guia.pdf' }],
    ['titulo', { id_clase: 3, id_usuario: 5, url: 'https://example.com/guia.pdf' }],
    ['url', { id_clase: 3, id_usuario: 5, titulo: 'Guia' }],
  ])('rechaza un material sin %s', async (campo, payload) => {
    const { servicio, materialRepository } = crearDependencias();

    await expect(servicio.crearMaterial(payload)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(materialRepository.crear).not.toHaveBeenCalled();
  });

  test('rechaza una URL invalida', async () => {
    const { servicio, materialRepository } = crearDependencias();

    await expect(
      servicio.crearMaterial({
        ...materialValido(5),
        url: 'archivo-local.pdf',
      })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(materialRepository.crear).not.toHaveBeenCalled();
  });

  test('rechaza aliases camelCase', async () => {
    const { servicio, materialRepository } = crearDependencias();

    await expect(
      servicio.crearMaterial({
        ...materialValido(5),
        usuarioId: 5,
      })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(materialRepository.crear).not.toHaveBeenCalled();
  });
});
