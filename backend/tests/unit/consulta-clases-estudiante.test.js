const { crearServicioInscripcion } = require('../../src/services/inscripcion.service');

describe('Consulta de clases del estudiante', () => {
  test('Consulta las inscripciones de un estudiante valido', async () => {
    const inscripciones = [
      {
        id: 31,
        id_inscripcion: 31,
        id_usuario: 8,
        id_clase: 12,
        estado: 'aceptada',
      },
    ];

    const inscripcionRepository = {
      consultarInscripcionesDelEstudiante: jest.fn().mockResolvedValue(inscripciones),
    };

    const claseRepository = {};

    const usuarioRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 8,
        rol: 'estudiante',
      }),
    };

    const servicio = crearServicioInscripcion({
      inscripcionRepository,
      claseRepository,
      usuarioRepository,
    });

    const resultado = await servicio.buscarInscripcionesDelEstudiante(8);

    expect(usuarioRepository.buscarPorId).toHaveBeenCalledWith(8);
    expect(inscripcionRepository.consultarInscripcionesDelEstudiante).toHaveBeenCalledWith(8);
    expect(resultado).toEqual(inscripciones);
  });

  test('Rechaza consultar inscripciones cuando el usuario no es estudiante', async () => {
    const inscripcionRepository = {
      consultarInscripcionesDelEstudiante: jest.fn(),
    };

    const claseRepository = {};

    const usuarioRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 4,
        rol: 'mentor',
      }),
    };

    const servicio = crearServicioInscripcion({
      inscripcionRepository,
      claseRepository,
      usuarioRepository,
    });

    await expect(servicio.buscarInscripcionesDelEstudiante(4)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    expect(usuarioRepository.buscarPorId).toHaveBeenCalledWith(4);
    expect(inscripcionRepository.consultarInscripcionesDelEstudiante).not.toHaveBeenCalled();
  });
});