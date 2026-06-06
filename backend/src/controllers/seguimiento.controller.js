function crearControladorSeguimiento({ seguimientoService }) {
  return {
    async listar(req, res, next) {
      try {
        const data = await seguimientoService.listarSeguimientos();
        res.json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },

    async listarPorInscripcion(req, res, next) {
      try {
        const data = await seguimientoService.listarSeguimientosPorInscripcion(req.params.id_inscripcion);
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
