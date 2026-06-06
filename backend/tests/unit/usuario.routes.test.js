const { crearRutasUsuario } = require('../../src/routes/usuario.routes');

describe('Rutas de usuarios', () => {
  test('POST /usuarios no permite password_hash directo', () => {
    const usuarioController = {
      obtenerPerfilPublicoMentor: jest.fn(),
      obtenerPorId: jest.fn(),
      actualizar: jest.fn(),
    };
    const router = crearRutasUsuario({ usuarioController });
    const rutasPost = router.stack
      .filter((layer) => layer.route?.methods?.post)
      .map((layer) => layer.route.path);

    expect(rutasPost).not.toContain('/');
  });
});
