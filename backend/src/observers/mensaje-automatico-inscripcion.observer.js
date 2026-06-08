function obtenerTituloClase(inscripcion = {}) {
  return inscripcion.claseTitulo || `la clase ${inscripcion.id_clase}`;
}

function construirContenido(inscripcion = {}) {
  const tituloClase = obtenerTituloClase(inscripcion);

  if (inscripcion.estado === 'aceptada') {
    return `Tu inscripcion a "${tituloClase}" fue aceptada por el mentor.`;
  }

  if (inscripcion.estado === 'rechazada') {
    return `Tu inscripcion a "${tituloClase}" fue rechazada por el mentor.`;
  }

  return null;
}

function crearObservadorMensajeAutomaticoInscripcion({ mensajeRepository }) {
  return {
    async actualizar(evento = {}) {
      const inscripcion = evento.inscripcion || {};
      const contenido = construirContenido(inscripcion);

      if (!contenido) return null;

      return mensajeRepository.crear({
        id_inscripcion: inscripcion.id_inscripcion,
        id_remitente: inscripcion.id_mentor,
        id_destinatario: inscripcion.id_usuario,
        contenido,
      });
    },
  };
}

module.exports = {
  crearObservadorMensajeAutomaticoInscripcion,
};
