/**
 * Traduce errores del dominio a codigos HTTP. Esto permite que la capa de
 * servicios exprese problemas funcionales sin depender directamente de Express.
 */
function resolverEstadoHttp(error, fallbackStatus = 500) {
  if (error.code === 'VALIDATION_ERROR') return 400;
  if (error.code === 'FORBIDDEN') return 403;
  if (error.code === 'NOT_FOUND') return 404;
  return fallbackStatus;
}

/**
 * Controller del recurso clase.
 *
 * Esta capa recibe la solicitud HTTP, extrae parametros de req y delega la
 * resolucion al service. Su objetivo es mantener separada la comunicacion web
 * de las reglas de negocio.
 */
function crearControladorClase({ claseService }) {
  return {
    async listar(req, res) {
      try {
        // Si se recibe id_mentor, el listado queda acotado a las clases de ese
        // mentor; si no, se responde con el catalogo general de clases.
        const mentorId = req.query.id_mentor;
        const data = mentorId
          ? await claseService.listarClasesPorMentor(mentorId)
          : await claseService.listarClases(req.query || {});
        res.json({ success: true, data });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ success: false, error: err.message });
      }
    },

    async obtenerPorId(req, res) {
      try {
        const data = await claseService.obtenerClase(req.params.id);
        res.json({ success: true, data });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ success: false, error: err.message });
      }
    },

    async crear(req, res) {
      try {
        // El cuerpo de la peticion se envia al service, que valida autoria,
        // datos obligatorios y pertenencia de materia.
        const data = await claseService.crearClase(req.body || {});
        res.status(201).json({ success: true, data });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ success: false, error: err.message });
      }
    },

    async actualizar(req, res) {
      try {
        // La identificacion de la clase viaja por URL y los nuevos datos por el
        // cuerpo; el controller solo coordina esa informacion.
        const data = await claseService.actualizarClase(req.params.id, req.body || {});
        res.json({ success: true, data });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ success: false, error: err.message });
      }
    },

    async eliminar(req, res) {
      try {
        // La eliminacion tambien se delega al service para preservar el control
        // de propiedad de la clase.
        const data = await claseService.eliminarClase(req.params.id, req.body || {});
        res.json({ success: true, data });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ success: false, error: err.message });
      }
    },
  };
}

module.exports = {
  crearControladorClase,
};
