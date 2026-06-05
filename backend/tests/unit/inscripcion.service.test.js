const { crearServicioInscripcion } = require('../../src/services/inscripcion.service');

describe('Inscripciones: cambio de estado', () => {
  test('incrementa el cupo al aceptar una inscripcion', async () => {
    const inscripcionAceptada = {
      id: 21,
      id_clase: 9,
      id_mentor: 4,
      estado: 'aceptada',
    };
    const inscripcionRepository = {
      obtenerPorId: jest.fn().mockResolvedValue({
        id: 21,
        id_clase: 9,
        id_mentor: 4,
        estado: 'pendiente',
      }),
      cambiarEstadoAceptada: jest.fn().mockResolvedValue(inscripcionAceptada),
    };
    const claseRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 9,
        completa: false,
      }),
      incrementarCupoActual: jest.fn().mockResolvedValue({
        id: 9,
        cupoActual: 1,
      }),
    };
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

    const resultado = await servicio.cambiarEstadoInscripcion(21, {
      estado: 'aceptada',
      id_mentor: 4,
    });

    expect(inscripcionRepository.obtenerPorId).toHaveBeenCalledWith(21);
    expect(usuarioRepository.buscarPorId).toHaveBeenCalledWith(4);
    expect(claseRepository.buscarPorId).toHaveBeenCalledWith(9);
    expect(claseRepository.incrementarCupoActual).toHaveBeenCalledWith(9);
    expect(inscripcionRepository.cambiarEstadoAceptada).toHaveBeenCalledWith(21);
    expect(resultado).toEqual(inscripcionAceptada);
  });

  test('decrementa el cupo al rechazar una inscripcion aceptada', async () => {
    const inscripcionRechazada = {
      id: 22,
      id_clase: 10,
      id_mentor: 5,
      estado: 'rechazada',
    };
    const inscripcionRepository = {
      obtenerPorId: jest.fn().mockResolvedValue({
        id: 22,
        id_clase: 10,
        id_mentor: 5,
        estado: 'aceptada',
      }),
      cambiarEstadoRechazada: jest.fn().mockResolvedValue(inscripcionRechazada),
    };
    const claseRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 10,
        completa: false,
      }),
      decrementarCupoActual: jest.fn().mockResolvedValue({
        id: 10,
        cupoActual: 1,
      }),
    };
    const usuarioRepository = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: 5,
        rol: 'mentor',
      }),
    };
    const servicio = crearServicioInscripcion({
      inscripcionRepository,
      claseRepository,
      usuarioRepository,
    });

    const resultado = await servicio.cambiarEstadoInscripcion(22, {
      estado: 'rechazada',
      id_mentor: 5,
    });

    expect(inscripcionRepository.obtenerPorId).toHaveBeenCalledWith(22);
    expect(usuarioRepository.buscarPorId).toHaveBeenCalledWith(5);
    expect(claseRepository.buscarPorId).toHaveBeenCalledWith(10);
    expect(claseRepository.decrementarCupoActual).toHaveBeenCalledWith(10);
    expect(inscripcionRepository.cambiarEstadoRechazada).toHaveBeenCalledWith(22);
    expect(resultado).toEqual(inscripcionRechazada);
  });
});
