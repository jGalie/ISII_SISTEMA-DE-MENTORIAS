jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('../../src/config/db', () => ({
  pool: {},
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
