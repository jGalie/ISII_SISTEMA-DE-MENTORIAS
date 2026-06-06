function crearControladorSeguimiento({ seguimientoService }) {
  return {
    async listarPorInscripcion(req, res, next) {
      try {
        const data = await seguimientoService.listarSeguimientosPorInscripcion(
          req.params.id_inscripcion,
          req.query || {}
        );
        res.json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },

    async crear(req, res, next) {
      try {
        const data = await seguimientoService.registrarSeguimiento(req.body || {});
        res.status(201).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  crearControladorSeguimiento,
};
