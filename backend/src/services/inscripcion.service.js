function crearErrorApp(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function rechazarCamposFueraDeContrato(datos = {}) {
  const campoInvalido = Object.keys(datos).find((campo) => /[A-Z]/.test(campo));
  if (campoInvalido) {
    throw crearErrorApp(`El campo ${campoInvalido} no pertenece al contrato snake_case.`, 'VALIDATION_ERROR');
  }
}

function validarCupoClase(clase) {
  const cupo_actual = Number(clase?.cupo_actual ?? clase?.cupoActual ?? 0);
  const cupo_maximo = Number(clase?.cupo_maximo ?? clase?.cupoMaximo ?? 0);

  if (cupo_actual < 0) {
    throw crearErrorApp('El cupo actual de la clase no puede ser negativo.', 'VALIDATION_ERROR');
  }
  if (cupo_maximo > 0 && cupo_actual > cupo_maximo) {
    throw crearErrorApp('El cupo actual no puede superar el cupo maximo.', 'VALIDATION_ERROR');
  }
}

function crearServicioInscripcion({ inscripcionRepository, claseRepository, usuarioRepository }) {
  async function obtenerInscripcionGestionable(id_inscripcion, id_mentor) {
    const inscripcion = await inscripcionRepository.obtenerPorId(Number(id_inscripcion));
    if (!inscripcion) {
      throw crearErrorApp('Inscripcion no encontrada.', 'NOT_FOUND');
    }

    const id_mentor_normalizado = Number(id_mentor);
    if (!id_mentor_normalizado) {
      throw crearErrorApp('Debes indicar el mentor para gestionar la inscripcion.', 'VALIDATION_ERROR');
    }

    const mentor = await usuarioRepository.buscarPorId(id_mentor_normalizado);
    if (!mentor || mentor.rol !== 'mentor') {
      throw crearErrorApp('Mentor no valido para actualizar la inscripcion.', 'VALIDATION_ERROR');
    }

    if (Number(inscripcion.id_mentor) !== id_mentor_normalizado) {
      throw crearErrorApp('No puedes gestionar inscripciones de otra clase.', 'FORBIDDEN');
    }

    return inscripcion;
  }

  async function obtenerClaseGestionable(inscripcion) {
    const clase = await claseRepository.buscarPorId(inscripcion.id_clase);
    if (!clase) {
      throw crearErrorApp('La clase indicada no existe.', 'NOT_FOUND');
    }

    validarCupoClase(clase);
    return clase;
  }

  return {
    async solicitarInscripcion(solicitudInscripcion) {
      /**
       * Este es el flujo central para estudiantes:
       * solicitar una clase sin duplicar registros ni permitir
       * inconsistencias como inscribirse en la propia publicacion.
       */
      rechazarCamposFueraDeContrato(solicitudInscripcion);
      const id_usuario = Number(solicitudInscripcion?.id_usuario);
      const id_clase = Number(solicitudInscripcion?.id_clase);

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
      validarCupoClase(clase);
      if (clase.completa) {
        throw crearErrorApp('La clase ya no tiene cupos disponibles.', 'VALIDATION_ERROR');
      }
      if (Number(clase.id_mentor) === id_usuario) {
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
      rechazarCamposFueraDeContrato(datosInscripcion);
      const estado = String(datosInscripcion?.estado || '').trim().toLowerCase();
      const id_mentor = Number(datosInscripcion?.id_mentor);

      if (!estado) {
        throw crearErrorApp('El estado es obligatorio.', 'VALIDATION_ERROR');
      }

      if (!id_mentor) {
        throw crearErrorApp('El id_mentor es obligatorio.', 'VALIDATION_ERROR');
      }

      if (estado === 'aceptada') {
        return this.aceptarInscripcion(id_inscripcion, id_mentor);
      }

      if (estado === 'rechazada') {
        return this.rechazarInscripcion(id_inscripcion, id_mentor);
      }

      throw crearErrorApp('Estado de inscripcion invalido.', 'VALIDATION_ERROR');
    },

    async aceptarInscripcion(id_inscripcion, id_mentor) {
      const id_inscripcion_normalizado = Number(id_inscripcion);
      const inscripcion = await obtenerInscripcionGestionable(id_inscripcion_normalizado, id_mentor);

      if (inscripcion.estado !== 'pendiente') {
        throw crearErrorApp('Solo se pueden aceptar inscripciones pendientes.', 'VALIDATION_ERROR');
      }

      if (inscripcion.estado !== 'aceptada') {
        const clase = await obtenerClaseGestionable(inscripcion);
        if (clase.completa) {
          throw crearErrorApp('La clase ya no tiene cupos disponibles.', 'VALIDATION_ERROR');
        }

        const claseActualizada = await claseRepository.incrementarCupoActual(inscripcion.id_clase);
        if (!claseActualizada) {
          throw crearErrorApp('La clase ya no tiene cupos disponibles.', 'VALIDATION_ERROR');
        }
      }

      return inscripcionRepository.cambiarEstadoAceptada(id_inscripcion_normalizado);
    },

    async rechazarInscripcion(id_inscripcion, id_mentor) {
      const id_inscripcion_normalizado = Number(id_inscripcion);
      const inscripcion = await obtenerInscripcionGestionable(id_inscripcion_normalizado, id_mentor);
      await obtenerClaseGestionable(inscripcion);

      if (!['pendiente', 'aceptada'].includes(inscripcion.estado)) {
        throw crearErrorApp('La transicion de estado solicitada no esta permitida.', 'VALIDATION_ERROR');
      }

      if (inscripcion.estado === 'aceptada') {
        await claseRepository.decrementarCupoActual(inscripcion.id_clase);
      }

      return inscripcionRepository.cambiarEstadoRechazada(id_inscripcion_normalizado);
    },
  };
}

module.exports = {
  crearServicioInscripcion,
};
