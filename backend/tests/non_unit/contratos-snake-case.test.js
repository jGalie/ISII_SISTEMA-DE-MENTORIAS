const { mapearClase } = require('../../src/models/clase.model');
const { mapearInscripcion } = require('../../src/models/inscripcion.model');
const { mapearValoracion } = require('../../src/models/valoracion.model');

describe('Contratos snake_case de modelos', () => {
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
});
