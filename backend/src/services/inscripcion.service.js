const { crearEstrategiasEstadoInscripcion } = require('../strategies/inscripcion');

function crearErrorApp(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function crearServicioInscripcion({ inscripcionRepository, claseRepository, usuarioRepository }) {
  const estrategiasEstado = crearEstrategiasEstadoInscripcion({
    inscripcionRepository,
    claseRepository,
    usuarioRepository,
  });

  return {
    async solicitarInscripcion(solicitudInscripcion) {
      /**
       * Este es el flujo central para estudiantes:
       * solicitar una clase sin duplicar registros ni permitir
       * inconsistencias como inscribirse en la propia publicacion.
       */
      const id_usuario = Number(solicitudInscripcion?.id_usuario || solicitudInscripcion?.idUsuario);
      const id_clase = Number(solicitudInscripcion?.id_clase || solicitudInscripcion?.idClase);

      if (!id_usuario || !id_clase) {
        throw crearErrorApp('Debes indicar usuario y clase para inscribirte.', 'VALIDATION_ERROR');
      }

      const usuario = await usuarioRepository.buscarPorId(id_usuario);
      if (!usuario || usuario.rol !== 'estudiante') {
        throw crearErrorApp('Solo un estudiante puede solicitar una inscripcion.', 'VALIDATION_ERROR');
      }

      const clase = await claseRepository.buscarPorId(id_clase);
      if (!clase) {
        throw crearErrorApp('La clase indicada no existe.', 'NOT_FOUND');
      }
      if (clase.completa) {
        throw crearErrorApp('La clase ya no tiene cupos disponibles.', 'VALIDATION_ERROR');
      }
      if (clase.mentorId === id_usuario) {
        throw crearErrorApp('No puedes inscribirte en tu propia clase.', 'VALIDATION_ERROR');
      }

      const inscripcionExistente = await inscripcionRepository.buscarExistente(id_usuario, id_clase);
      if (inscripcionExistente) {
        throw crearErrorApp('Ya existe una inscripcion para esa clase.', 'DUPLICATE_ENROLLMENT');
      }

      return inscripcionRepository.crearInscripcion({ id_usuario, id_clase, estado: 'pendiente' });
    },

    async buscarInscripcionesDelEstudiante(id_usuario) {
      const usuario = await usuarioRepository.buscarPorId(id_usuario);
      this.validarUsuarioEstudiante(usuario);
      return inscripcionRepository.consultarInscripcionesDelEstudiante(id_usuario);
    },

    validarUsuarioEstudiante(usuario) {
      if (!usuario) {
        throw crearErrorApp('Usuario no encontrado.', 'NOT_FOUND');
      }
      if (usuario.rol !== 'estudiante') {
        throw crearErrorApp('Usuario no valido para consultar inscripciones.', 'VALIDATION_ERROR');
      }
    },

    async buscarSolicitudesDelMentor(id_mentor) {
      const mentor = await usuarioRepository.buscarPorId(id_mentor);
      if (!mentor || mentor.rol !== 'mentor') {
        throw crearErrorApp('Mentor no encontrado.', 'NOT_FOUND');
      }
      return inscripcionRepository.buscarSolicitudesDelMentor(id_mentor);
    },

    async cambiarEstadoInscripcion(id_inscripcion, datosInscripcion) {
      // Metodo donde se aplica Strategy: selecciona la estrategia concreta y
      // delega el algoritmo de cambio de estado.
      const estado = String(datosInscripcion?.estado || '').trim().toLowerCase();
      const id_mentor = Number(datosInscripcion?.id_mentor || datosInscripcion?.mentorId);
      const estrategia = estrategiasEstado[estado];

      if (!estrategia) {
        throw crearErrorApp('Estado de inscripcion invalido.', 'VALIDATION_ERROR');
      }

      return estrategia.ejecutar(Number(id_inscripcion), id_mentor);
    },

    async aceptarInscripcion(id_inscripcion, id_mentor) {
      return this.cambiarEstadoInscripcion(id_inscripcion, { estado: 'aceptada', id_mentor });
    },

    async rechazarInscripcion(id_inscripcion, id_mentor) {
      return this.cambiarEstadoInscripcion(id_inscripcion, { estado: 'rechazada', id_mentor });
    },

    async marcarInscripcionPendiente(id_inscripcion, id_mentor) {
      return this.cambiarEstadoInscripcion(id_inscripcion, { estado: 'pendiente', id_mentor });
    },
  };
}

module.exports = {
  crearServicioInscripcion,
};
