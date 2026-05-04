const { mapearInscripcion } = require('../models/inscripcion.model');

function crearRepositorioInscripcion({ pool }) {
  return {
    async crearInscripcion({ id_usuario, id_clase, estado = 'pendiente' }) {
      const [resultadoCreacion] = await pool.query(
        `
          INSERT INTO inscripciones (id_usuario, id_clase, estado)
          VALUES (?, ?, ?)
        `,
        [id_usuario, id_clase, estado]
      );

      return this.obtenerPorId(resultadoCreacion.insertId);
    },

    async obtenerPorId(id_inscripcion) {
      // Esta consulta recompone toda la informacion de contexto
      // necesaria para mostrar una inscripcion en las interfaces.
      const [filasInscripcion] = await pool.query(
        `
          SELECT
            i.id_inscripcion,
            i.id_usuario,
            i.id_clase,
            i.estado,
            i.fecha_solicitud,
            c.titulo AS clase_titulo,
            c.descripcion AS clase_descripcion,
            c.fecha AS clase_fecha,
            c.id_mentor,
            mentor.nombre AS mentor_nombre,
            u.nombre AS usuario_nombre,
            u.email AS usuario_email
          FROM inscripciones i
          INNER JOIN clases c ON c.id_clase = i.id_clase
          INNER JOIN usuarios mentor ON mentor.id_usuario = c.id_mentor
          INNER JOIN usuarios u ON u.id_usuario = i.id_usuario
          WHERE i.id_inscripcion = ?
          LIMIT 1
        `,
        [Number(id_inscripcion)]
      );

      return filasInscripcion.length ? mapearInscripcion(filasInscripcion[0]) : null;
    },

    async consultarInscripcionesDelEstudiante(id_usuario) {
      const [filasInscripcionesEstudiante] = await pool.query(
        `
          SELECT
            i.id_inscripcion,
            i.id_usuario,
            i.id_clase,
            i.estado,
            i.fecha_solicitud,
            c.titulo AS clase_titulo,
            c.descripcion AS clase_descripcion,
            c.fecha AS clase_fecha,
            c.id_mentor,
            mentor.nombre AS mentor_nombre
          FROM inscripciones i
          INNER JOIN clases c ON c.id_clase = i.id_clase
          INNER JOIN usuarios mentor ON mentor.id_usuario = c.id_mentor
          WHERE i.id_usuario = ?
          ORDER BY i.fecha_solicitud DESC
        `,
        [Number(id_usuario)]
      );

      return filasInscripcionesEstudiante.map(mapearInscripcion);
    },

    async buscarSolicitudesDelMentor(id_mentor) {
      // El orden prioriza pendientes para ayudar al mentor a resolver primero
      // las solicitudes que aun requieren accion.
      const [filasInscripcionesMentor] = await pool.query(
        `
          SELECT
            i.id_inscripcion,
            i.id_usuario,
            i.id_clase,
            i.estado,
            i.fecha_solicitud,
            c.titulo AS clase_titulo,
            c.descripcion AS clase_descripcion,
            c.fecha AS clase_fecha,
            c.id_mentor,
            mentor.nombre AS mentor_nombre,
            u.nombre AS usuario_nombre,
            u.email AS usuario_email
          FROM inscripciones i
          INNER JOIN clases c ON c.id_clase = i.id_clase
          INNER JOIN usuarios mentor ON mentor.id_usuario = c.id_mentor
          INNER JOIN usuarios u ON u.id_usuario = i.id_usuario
          WHERE c.id_mentor = ?
          ORDER BY
            CASE i.estado
              WHEN 'pendiente' THEN 0
              WHEN 'aceptada' THEN 1
              ELSE 2
            END,
            i.fecha_solicitud DESC
        `,
        [Number(id_mentor)]
      );

      return filasInscripcionesMentor.map(mapearInscripcion);
    },

    async actualizarEstado(id_inscripcion, estado) {
      await pool.query(
        `
          UPDATE inscripciones
          SET estado = ?
          WHERE id_inscripcion = ?
        `,
        [estado, Number(id_inscripcion)]
      );

      return this.obtenerPorId(id_inscripcion);
    },

    async cambiarEstadoAceptada(id_inscripcion) {
      return this.actualizarEstado(id_inscripcion, 'aceptada');
    },

    async cambiarEstadoRechazada(id_inscripcion) {
      return this.actualizarEstado(id_inscripcion, 'rechazada');
    },

    async cambiarEstadoPendiente(id_inscripcion) {
      return this.actualizarEstado(id_inscripcion, 'pendiente');
    },

    async buscarSolicitudesPendientes(id_mentor) {
      const [filasSolicitudesPendientes] = await pool.query(
        `
          SELECT
            i.id_inscripcion,
            i.id_usuario,
            i.id_clase,
            i.estado,
            i.fecha_solicitud,
            c.titulo AS clase_titulo,
            c.descripcion AS clase_descripcion,
            c.fecha AS clase_fecha,
            c.id_mentor,
            mentor.nombre AS mentor_nombre,
            u.nombre AS usuario_nombre,
            u.email AS usuario_email
          FROM inscripciones i
          INNER JOIN clases c ON c.id_clase = i.id_clase
          INNER JOIN usuarios mentor ON mentor.id_usuario = c.id_mentor
          INNER JOIN usuarios u ON u.id_usuario = i.id_usuario
          WHERE c.id_mentor = ?
            AND i.estado = 'pendiente'
          ORDER BY i.fecha_solicitud DESC
        `,
        [Number(id_mentor)]
      );

      return filasSolicitudesPendientes.map(mapearInscripcion);
    },

    async buscarExistente(id_usuario, id_clase) {
      const [filasInscripcionExistente] = await pool.query(
        `
          SELECT id_inscripcion, id_usuario, id_clase, estado, fecha_solicitud
          FROM inscripciones
          WHERE id_usuario = ? AND id_clase = ?
          LIMIT 1
        `,
        [Number(id_usuario), Number(id_clase)]
      );

      return filasInscripcionExistente.length ? mapearInscripcion(filasInscripcionExistente[0]) : null;
    },
  };
}

module.exports = {
  crearRepositorioInscripcion,
};
