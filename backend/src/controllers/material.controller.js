function crearControladorMaterial({ materialService }) {
  return {
    async listarPorClase(req, res, next) {
      try {
        const data = await materialService.listarMaterialesPorClase(
          req.params.id_clase,
          req.query || {}
        );
        res.json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },

    async crear(req, res, next) {
      try {
        const data = await materialService.crearMaterial(req.body || {});
        res.status(201).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  crearControladorMaterial,
};
