function crearControladorMentorMateria({ mentorMateriaService }) {
  return {
    async listar(req, res, next) {
      try {
        const data = await mentorMateriaService.listarMateriasDelMentor(req.query || {});
        res.json({ data });
      } catch (error) {
        next(error);
      }
    },

    async crear(req, res, next) {
      try {
        const data = await mentorMateriaService.asociarMateriaMentor(req.body || {});
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  crearControladorMentorMateria,
};
