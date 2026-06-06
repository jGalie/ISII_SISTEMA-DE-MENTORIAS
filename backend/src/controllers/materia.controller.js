function crearControladorMateria({ materiaService }) {
  return {
    async listar(req, res, next) {
      try {
        const data = await materiaService.listarMaterias();
        res.json({ data });
      } catch (error) {
        next(error);
      }
    },

    async crear(req, res, next) {
      try {
        const data = await materiaService.crearMateria(req.body || {});
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  crearControladorMateria,
};
