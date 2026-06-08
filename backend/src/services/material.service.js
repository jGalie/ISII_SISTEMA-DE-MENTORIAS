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

function normalizarIdClase(value) {
  const id_clase = Number(value);
  if (!Number.isInteger(id_clase) || id_clase < 1) {
    throw crearErrorApp('El id_clase es obligatorio y debe ser valido.', 'VALIDATION_ERROR');
  }
  return id_clase;
}

function normalizarUrl(value) {
  const url = String(value || '').trim();
  if (!url) {
    throw crearErrorApp('La URL del material es obligatoria.', 'VALIDATION_ERROR');
  }

  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Protocolo no permitido');
    }
  } catch {
    throw crearErrorApp('La URL del material no tiene un formato valido.', 'VALIDATION_ERROR');
  }

  return url;
}

function crearServicioMaterial({
  materialRepository,
  claseRepository,
  inscripcionRepository,
  usuarioRepository,
}) {
  async function verificarClase(id_clase) {
    const clase = await claseRepository.buscarPorId(id_clase);
    if (!clase) {
      throw crearErrorApp('La clase indicada no existe.', 'NOT_FOUND');
    }
    return clase;
  }

  async function obtenerActor(datos = {}) {
    const id_usuario = Number(datos.id_usuario ?? datos.id_mentor);
    if (!Number.isInteger(id_usuario) || id_usuario < 1) {
      throw crearErrorApp('Debes indicar el id_usuario del actor.', 'VALIDATION_ERROR');
    }
    if (
      datos.id_usuario !== undefined &&
      datos.id_mentor !== undefined &&
      Number(datos.id_usuario) !== Number(datos.id_mentor)
    ) {
      throw crearErrorApp('Los identificadores del actor no coinciden.', 'VALIDATION_ERROR');
    }

    const actor = await usuarioRepository.buscarPorId(id_usuario);
    if (!actor) {
      throw crearErrorApp('El usuario indicado no existe.', 'NOT_FOUND');
    }

    return { actor, id_usuario };
  }

  return {
    async listarMaterialesPorClase(id_clase, datosConsulta = {}) {
      rechazarCamposFueraDeContrato(datosConsulta);
      const idClaseNormalizado = normalizarIdClase(id_clase);
      const clase = await verificarClase(idClaseNormalizado);
      const { actor, id_usuario } = await obtenerActor(datosConsulta);

      if (actor.rol === 'mentor' && id_usuario === Number(clase.id_mentor)) {
        return materialRepository.buscarPorClase(idClaseNormalizado);
      }

      if (actor.rol === 'estudiante') {
        const inscripcion = await inscripcionRepository.buscarExistente(
          id_usuario,
          idClaseNormalizado
        );
        if (inscripcion?.estado === 'aceptada') {
          return materialRepository.buscarPorClase(idClaseNormalizado);
        }
      }

      throw crearErrorApp('No puedes consultar los materiales de esta clase.', 'FORBIDDEN');
    },

    async crearMaterial(datosMaterial = {}) {
      rechazarCamposFueraDeContrato(datosMaterial);

      const id_clase = normalizarIdClase(datosMaterial.id_clase);
      const titulo = String(datosMaterial.titulo || '').trim();
      const url = normalizarUrl(datosMaterial.url);

      if (!titulo) {
        throw crearErrorApp('El titulo del material es obligatorio.', 'VALIDATION_ERROR');
      }
      if (titulo.length > 120) {
        throw crearErrorApp('El titulo del material no puede superar los 120 caracteres.', 'VALIDATION_ERROR');
      }

      const clase = await verificarClase(id_clase);
      const { actor, id_usuario } = await obtenerActor(datosMaterial);

      if (actor.rol !== 'mentor' || id_usuario !== Number(clase.id_mentor)) {
        throw crearErrorApp(
          'Solo el mentor duenio de la clase puede crear materiales.',
          'FORBIDDEN'
        );
      }

      return materialRepository.crear({ id_clase, titulo, url });
    },
  };
}

module.exports = {
  crearServicioMaterial,
};
