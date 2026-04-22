const { toInscripcion } = require('../models/inscripcion.model');

function createInscripcionRepository({ pool }) {
  return {
    async createInscripcion({ id_usuario, id_clase, estado = 'pendiente' }) {
      const [result] = await pool.query(
        `
          INSERT INTO inscripciones (id_usuario, id_clase, estado)
          VALUES (?, ?, ?)
        `,
        [id_usuario, id_clase, estado]
      );

      return this.getById(result.insertId);
    },

    async getById(id) {
      // Esta consulta recompone toda la informacion de contexto
      // necesaria para mostrar una inscripcion en las interfaces.
      const [rows] = await pool.query(
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
        [Number(id)]
      );

      return rows.length ? toInscripcion(rows[0]) : null;
    },

    async getByUsuario(idUsuario) {
      const [rows] = await pool.query(
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
        [Number(idUsuario)]
      );

      return rows.map(toInscripcion);
    },

    async getByMentor(idMentor) {
      // El orden prioriza pendientes para ayudar al mentor a resolver primero
      // las solicitudes que aun requieren accion.
      const [rows] = await pool.query(
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
        [Number(idMentor)]
      );

      return rows.map(toInscripcion);
    },

    async updateEstado(idInscripcion, estado) {
      await pool.query(
        `
          UPDATE inscripciones
          SET estado = ?
          WHERE id_inscripcion = ?
        `,
        [estado, Number(idInscripcion)]
      );

      return this.getById(idInscripcion);
    },

    async findExisting(idUsuario, idClase) {
      const [rows] = await pool.query(
        `
          SELECT id_inscripcion, id_usuario, id_clase, estado, fecha_solicitud
          FROM inscripciones
          WHERE id_usuario = ? AND id_clase = ?
          LIMIT 1
        `,
        [Number(idUsuario), Number(idClase)]
      );

      return rows.length ? toInscripcion(rows[0]) : null;
    },
  };
}

module.exports = {
  createInscripcionRepository,
};
