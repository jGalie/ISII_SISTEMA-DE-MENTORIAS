jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('../../src/config/db', () => ({
}));

jest.mock('../../src/repositories/materia.repository', () => ({
  buscarOCrearPorNombre: jest.fn(),
}));

jest.mock('../../src/repositories/mentor-materia.repository', () => ({
  buscarPorMentor: jest.fn(),
  crear: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const { crearServicioAuth } = require('../../src/services/auth.service');

describe('Autenticacion: login', () => {
  test('inicia sesion con credenciales validas y no expone el password hash', async () => {
    const usuarioRepository = {
      buscarPorEmail: jest.fn().mockResolvedValue({
        id: 12,
        nombre: 'Ana Estudiante',
        email: 'ana@mentorix.com',
        password_hash: 'hash-guardado',
        rol: 'estudiante',
        nivelesEducativos: ['universitario'],
      }),
    };
    bcrypt.compare.mockResolvedValue(true);

    const servicio = crearServicioAuth({ usuarioRepository });
    const resultado = await servicio.iniciarSesion({
      email: ' ANA@MENTORIX.COM ',
      password: 'Clave123',
    });

    expect(usuarioRepository.buscarPorEmail).toHaveBeenCalledWith('ana@mentorix.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('Clave123', 'hash-guardado');
    expect(resultado).toMatchObject({
      id: 12,
      nombre: 'Ana Estudiante',
      email: 'ana@mentorix.com',
      rol: 'estudiante',
      materias: [],
    });
    expect(resultado).not.toHaveProperty('password_hash');
  });
});

describe('Autenticacion: registro', () => {
  test.each([
    ['rol desconocido', { rol: 'admin' }, 'El rol debe ser mentor o estudiante.'],
    ['nombre muy corto', { nombre: 'Al' }, 'El nombre debe tener entre 3 y 100 caracteres.'],
    ['password con espacios externos', { password: ' Clave123 ' }, 'La contrasena no debe tener espacios al inicio o al final.'],
    ['campo extra', { alias: 'dato externo' }, 'El campo alias no pertenece al contrato de operacion.'],
  ])('rechaza registro con %s', async (caso, override, message) => {
    const usuarioRepository = {
      buscarPorEmail: jest.fn(),
    };
    const servicio = crearServicioAuth({ usuarioRepository });

    await expect(
      servicio.registrar({
        nombre: 'Ana Estudiante',
        email: 'ana@mentorix.com',
        password: 'Clave123',
        rol: 'estudiante',
        nivelesEducativos: ['universitario'],
        ...override,
      })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message,
    });
    expect(usuarioRepository.buscarPorEmail).not.toHaveBeenCalled();
  });

  test('rechaza estudiantes con mas de un nivel educativo', async () => {
    const usuarioRepository = {
      buscarPorEmail: jest.fn(),
    };
    const servicio = crearServicioAuth({ usuarioRepository });

    await expect(
      servicio.registrar({
        nombre: 'Ana Estudiante',
        email: 'ana@mentorix.com',
        password: 'Clave123',
        rol: 'estudiante',
        nivelesEducativos: ['secundaria', 'universitario'],
      })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Debes seleccionar un unico nivel educativo de interes si te registras como estudiante.',
    });
    expect(usuarioRepository.buscarPorEmail).not.toHaveBeenCalled();
  });

  test('rechaza mentores sin nivel educativo', async () => {
    const usuarioRepository = {
      buscarPorEmail: jest.fn(),
    };
    const servicio = crearServicioAuth({ usuarioRepository });

    await expect(
      servicio.registrar({
        nombre: 'Bruno Mentor',
        email: 'bruno@mentorix.com',
        password: 'Clave123',
        rol: 'mentor',
        materias: ['Matematica'],
        nivelesEducativos: [],
      })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Debes seleccionar al menos un nivel educativo para registrarte como mentor.',
    });
    expect(usuarioRepository.buscarPorEmail).not.toHaveBeenCalled();
  });
});

describe('Autenticacion: contrato login', () => {
  test('rechaza campos extra en login', async () => {
    const usuarioRepository = {
      buscarPorEmail: jest.fn(),
    };
    const servicio = crearServicioAuth({ usuarioRepository });

    await expect(
      servicio.iniciarSesion({
        email: 'ana@mentorix.com',
        password: 'Clave123',
        recordar: true,
      })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'El campo recordar no pertenece al contrato de operacion.',
    });
    expect(usuarioRepository.buscarPorEmail).not.toHaveBeenCalled();
  });
});
