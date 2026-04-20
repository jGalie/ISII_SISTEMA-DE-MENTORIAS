function requireFields(body, fields) {
  for (const field of fields) {
    if (body[field] == null || String(body[field]).trim() === '') {
      throw new Error(`Campo obligatorio: ${field}`);
    }
  }
}

function createUsuarioService({ usuarioRepository }) {
  return {
    async listar() {
      return usuarioRepository.findAll();
    },

    async crear(body) {
      requireFields(body, ['nombre', 'email', 'password_hash']);
      const rol = body.rol === 'mentor' ? 'mentor' : 'estudiante';
      return usuarioRepository.create({
        nombre: String(body.nombre).trim(),
        email: String(body.email).trim().toLowerCase(),
        password_hash: body.password_hash,
        rol,
      });
    },
  };
}

module.exports = {
  createUsuarioService,
};
