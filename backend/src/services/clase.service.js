/**
 * Construye errores con codigo funcional. Estos codigos permiten que el
 * controller decida la respuesta HTTP sin mezclar responsabilidades.
 */
function crearErrorApp(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Valida y normaliza los datos basicos de una clase.
 *
 * Esta funcion pertenece a la capa de servicios porque define condiciones del
 * dominio: toda clase debe tener titulo, descripcion, fecha, materia, precio
 * valido y una ubicacion cuando la modalidad sea presencial.
 */
function validarDatosClase(data) {
  /**
   * Crear y editar una clase comparten el mismo criterio de validacion.
   * Por eso esta funcion centraliza los requisitos funcionales minimos
   * que debe cumplir una publicacion.
   */
  const titulo = String(data?.titulo || '').trim();
  const descripcion = String(data?.descripcion || '').trim();
  const fecha = String(data?.fecha || '').trim();
  const modalidad = String(data?.modalidad || 'virtual').trim().toLowerCase();
  const id_materia = Number(data?.id_materia || data?.materiaId);
  const precio = Number(data?.precio);
  const ubicacion = String(data?.ubicacion || '').trim();
  const cupo_maximo = Number(data?.cupo_maximo || data?.cupoMaximo || 1);

  if (!titulo || !descripcion || !fecha) {
    throw crearErrorApp('Titulo, descripcion y fecha son obligatorios.', 'VALIDATION_ERROR');
  }

  if (!['virtual', 'presencial'].includes(modalidad)) {
    throw crearErrorApp('Modalidad de clase invalida.', 'VALIDATION_ERROR');
  }

  if (!id_materia) {
    throw crearErrorApp('Debes seleccionar una materia para la clase.', 'VALIDATION_ERROR');
  }

  if (!Number.isFinite(precio) || precio < 0) {
    throw crearErrorApp('Debes ingresar un precio valido para la clase.', 'VALIDATION_ERROR');
  }

  if (!Number.isInteger(cupo_maximo) || cupo_maximo < 1) {
    throw crearErrorApp('Debes indicar un cupo maximo valido.', 'VALIDATION_ERROR');
  }

  if (modalidad === 'presencial' && !ubicacion) {
    throw crearErrorApp('Debes indicar una ubicacion para una clase presencial.', 'VALIDATION_ERROR');
  }

  return {
    titulo,
    descripcion,
    fecha,
    modalidad,
    id_materia,
    precio,
    ubicacion: modalidad === 'presencial' ? ubicacion : null,
    cupo_maximo,
  };
}

function crearServicioClase({ claseRepository, usuarioRepository, mentorMateriaRepository }) {
  return {
    async crearClase(data) {
      // Solo un mentor valido puede publicar. Ademas, la materia elegida debe
      // pertenecer a su perfil academico para evitar publicaciones inconsistentes.
      const payload = validarDatosClase(data);
      const id_mentor = Number(data?.id_mentor || data?.mentorId);

      if (!id_mentor) {
        throw crearErrorApp('Debes indicar el mentor creador.', 'VALIDATION_ERROR');
      }

      const mentor = await usuarioRepository.findById(id_mentor);
      if (!mentor || mentor.rol !== 'mentor') {
        throw crearErrorApp('Solo un mentor puede crear clases.', 'FORBIDDEN');
      }

      const hasSubject = await mentorMateriaRepository.exists(id_mentor, payload.id_materia);
      if (!hasSubject) {
        throw crearErrorApp('La materia seleccionada no pertenece a las materias registradas por el mentor.', 'FORBIDDEN');
      }

      return claseRepository.crearClase({ ...payload, id_mentor });
    },

    async listarClases() {
      // El service conserva una interfaz simple para el controller y delega la
      // lectura concreta al repository.
      return claseRepository.buscarTodas();
    },

    async obtenerClase(id) {
      // Se transforma la ausencia de datos en un error funcional explicito.
      const clase = await claseRepository.buscarPorId(id);
      if (!clase) {
        throw crearErrorApp('Clase no encontrada.', 'NOT_FOUND');
      }
      return clase;
    },

    async listarClasesPorMentor(id_mentor) {
      // Antes de listar por mentor se comprueba que el usuario exista y tenga
      // el rol correspondiente.
      const mentor = await usuarioRepository.findById(id_mentor);
      if (!mentor || mentor.rol !== 'mentor') {
        throw crearErrorApp('Mentor no encontrado.', 'NOT_FOUND');
      }
      return claseRepository.buscarPorMentor(id_mentor);
    },

    async actualizarClase(id, data) {
      // Se preserva la autoria: solo el mentor creador puede modificar la clase.
      const payload = validarDatosClase(data);
      const actorId = Number(data?.id_mentor || data?.mentorId);
      const clase = await claseRepository.buscarPorId(id);

      if (!clase) {
        throw crearErrorApp('Clase no encontrada.', 'NOT_FOUND');
      }
      if (!actorId || actorId !== clase.mentorId) {
        throw crearErrorApp('Solo el mentor creador puede editar esta clase.', 'FORBIDDEN');
      }
      if (payload.cupo_maximo < clase.cupoActual) {
        throw crearErrorApp('El cupo maximo no puede ser menor al cupo actual.', 'VALIDATION_ERROR');
      }

      const hasSubject = await mentorMateriaRepository.exists(actorId, payload.id_materia);
      if (!hasSubject) {
        throw crearErrorApp('La materia seleccionada no pertenece a las materias registradas por el mentor.', 'FORBIDDEN');
      }

      return claseRepository.actualizarClase(id, payload);
    },

    async eliminarClase(id, data) {
      // El mismo control de propiedad se aplica al borrado para que un mentor
      // no pueda eliminar clases creadas por otra persona.
      const actorId = Number(data?.id_mentor || data?.mentorId);
      const clase = await claseRepository.buscarPorId(id);

      if (!clase) {
        throw crearErrorApp('Clase no encontrada.', 'NOT_FOUND');
      }
      if (!actorId || actorId !== clase.mentorId) {
        throw crearErrorApp('Solo el mentor creador puede eliminar esta clase.', 'FORBIDDEN');
      }

      return claseRepository.eliminarClase(id);
    },
  };
}

module.exports = {
  crearServicioClase,
};
