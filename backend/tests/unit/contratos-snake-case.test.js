const { mapearClase } = require('../../src/models/clase.model');
const { mapearInscripcion } = require('../../src/models/inscripcion.model');
const { mapearValoracion } = require('../../src/models/valoracion.model');
const { crearServicioValoracion } = require('../../src/services/valoracion.service');

describe('Contratos snake_case', () => {
  test('los modelos no exponen aliases camelCase de identificadores', () => {
    const clase = mapearClase({
      id_clase: 1,
      id_mentor: 2,
      id_materia: 3,
      cupo_maximo: 4,
      cupo_actual: 1,
    });
    const inscripcion = mapearInscripcion({
      id_inscripcion: 5,
      id_usuario: 6,
      id_clase: 1,
      id_mentor: 2,
    });
    const valoracion = mapearValoracion({
      id_valoracion: 7,
      id_clase: 1,
      id_estudiante: 6,
      id_mentor: 2,
      estrellas: 5,
    });

    expect(clase).toMatchObject({ id_clase: 1, id_mentor: 2, id_materia: 3 });
    expect(inscripcion).toMatchObject({ id_inscripcion: 5, id_usuario: 6, id_clase: 1, id_mentor: 2 });
    expect(valoracion).toMatchObject({ id_clase: 1, id_estudiante: 6, id_mentor: 2 });

    const serializado = JSON.stringify({ clase, inscripcion, valoracion });
    expect(serializado).not.toMatch(/mentorId|materiaId|usuarioId|claseId/);
  });

  test.each([
    ['claseId', { claseId: 1, id_estudiante: 6 }],
    ['estudianteId', { id_clase: 1, estudianteId: 6 }],
    ['mentorId', { id_clase: 1, id_estudiante: 6, mentorId: 2 }],
  ])('valoraciones rechaza el alias camelCase %s', async (alias, datos) => {
    const servicio = crearServicioValoracion({
      valoracionRepository: {},
      claseRepository: {},
      usuarioRepository: {},
      inscripcionRepository: {},
    });

    await expect(servicio.crearValoracion({
      estrellas: 5,
      ...datos,
    })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  test('valoraciones rechaza comentarios demasiado largos', async () => {
    const servicio = crearServicioValoracion({
      valoracionRepository: {
        existeDeEstudianteEnClase: jest.fn(),
        crear: jest.fn(),
      },
      claseRepository: {
        buscarPorId: jest.fn(),
      },
      usuarioRepository: {
        buscarPorId: jest.fn(),
      },
      inscripcionRepository: {
        buscarExistente: jest.fn(),
      },
    });

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
  });
});
