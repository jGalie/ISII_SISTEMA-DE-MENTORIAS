const { crearServicioInscripcion } = require('../../src/services/inscripcion.service');

describe('Inscripciones: cambiar estado con Strategy', () => {
  test('delega en EstadoAceptadaStrategy e incrementa el cupo al aceptar', async () => {
    const inscripcionAceptada = {
      id: 21,
      claseId: 9,
      mentorId: 4,
      estado: 'aceptada',
    };
    const inscripcionRepository = {
      obtenerPorId: jest.fn().mockResolvedValue({
        id: 21,
        claseId: 9,
        mentorId: 4,
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
});
