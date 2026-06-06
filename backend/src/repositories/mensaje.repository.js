const { mapearMensaje } = require('../models/mensaje.model');

function crearRepositorioMensaje({ pool }) {
  const selectBase = `
    SELECT
      m.id_mensaje,
      m.id_inscripcion,
      m.id_remitente,
      m.id_destinatario,
      m.contenido,
      m.fecha_envio,
      m.fecha_lectura,
      remitente.nombre AS remitente_nombre,
      destinatario.nombre AS destinatario_nombre
    FROM mensajes m
    INNER JOIN usuarios remitente ON remitente.id_usuario = m.id_remitente
    INNER JOIN usuarios destinatario ON destinatario.id_usuario = m.id_destinatario
  `;

  return {
    async buscarTodos() {
      const [filasMensajes] = await pool.query(
        `
          ${selectBase}
          ORDER BY m.fecha_envio ASC, m.id_mensaje ASC
        `
      );

      return filasMensajes.map(mapearMensaje);
    },

    async crear({ id_inscripcion, id_remitente, id_destinatario, contenido }) {
      const [resultado] = await pool.query(
        `
          INSERT INTO mensajes (id_inscripcion, id_remitente, id_destinatario, contenido)
          VALUES (?, ?, ?, ?)
        `,
        [Number(id_inscripcion), Number(id_remitente), Number(id_destinatario), contenido]
      );

      return this.buscarPorId(resultado.insertId);
    },

    async buscarPorId(id_mensaje) {
      const [filasMensaje] = await pool.query(
        `
          ${selectBase}
          WHERE m.id_mensaje = ?
          LIMIT 1
        `,
        [Number(id_mensaje)]
      );

      return filasMensaje.length ? mapearMensaje(filasMensaje[0]) : null;
    },

    async buscarPorInscripcion(id_inscripcion) {
      const [filasMensajes] = await pool.query(
        `
          ${selectBase}
          WHERE m.id_inscripcion = ?
          ORDER BY m.fecha_envio ASC, m.id_mensaje ASC
        `,
        [Number(id_inscripcion)]
      );

      return filasMensajes.map(mapearMensaje);
    },
  };
}

module.exports = {
  crearRepositorioMensaje,
};
