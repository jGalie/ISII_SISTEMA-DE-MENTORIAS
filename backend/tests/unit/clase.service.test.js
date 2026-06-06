const { crearServicioClase } = require('../../src/services/clase.service');

describe('Clases: crear clase', () => {
  test('crea una clase cuando el mentor y la materia asociada son validos', async () => {
    const claseCreada = {
      id: 45,
      titulo: 'Algebra inicial',
      id_mentor: 7,
      id_materia: 3,
    };
    const claseRepository = {
      crearClase: jest.fn().mockResolvedValue(claseCreada),
    };
    const usuarioRepository = {
      buscarPorId: jest.fn().mockResolvedValue({ id: 7, rol: 'mentor' }),
    };
    const mentorMateriaRepository = {
      buscarAsociacion: jest.fn().mockResolvedValue({
        id_mentor: 7,
        id_materia: 3,
      }),
    };
    const servicio = crearServicioClase({
      claseRepository,
      usuarioRepository,
      mentorMateriaRepository,
    });

    const resultado = await servicio.crearClase({
      titulo: ' Algebra inicial ',
      descripcion: 'Repaso de ecuaciones',
      fecha: '2026-06-10T15:30:00Z',
      modalidad: 'virtual',
      id_materia: 3,
      precio: 8500,
      cupo_maximo: 5,
      id_mentor: 7,
    });

    expect(usuarioRepository.buscarPorId).toHaveBeenCalledWith(7);
    expect(mentorMateriaRepository.buscarAsociacion).toHaveBeenCalledWith(7, 3);
    expect(claseRepository.crearClase).toHaveBeenCalledWith({
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
});
