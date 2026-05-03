/**
 * Construye errores con codigo funcional. Estos codigos permiten que el
 * controller decida la respuesta HTTP sin mezclar responsabilidades.
 */
function crearErrorApp(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function tieneValor(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function normalizarFechaClase(value) {
  if (!tieneValor(value)) {
    throw crearErrorApp('Titulo, descripcion y fecha son obligatorios.', 'VALIDATION_ERROR');
  }

  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) {
    throw crearErrorApp('Debes indicar una fecha valida.', 'VALIDATION_ERROR');
  }

  return fecha.toISOString().slice(0, 19).replace('T', ' ');
}

function normalizarNumero(value, message) {
  if (!tieneValor(value)) {
    throw crearErrorApp(message, 'VALIDATION_ERROR');
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw crearErrorApp(message, 'VALIDATION_ERROR');
  }

  return number;
}

/**
 * Valida y normaliza los datos basicos de una clase.
 *
 * Esta funcion pertenece a la capa de servicios porque define condiciones del
 * dominio: toda clase debe tener titulo, descripcion, fecha, materia, precio
 * valido y una ubicacion cuando la modalidad sea presencial.
 */
function validarDatosClase(datosClase) {
  /**
   * Crear y editar una clase comparten el mismo criterio de validacion.
   * Por eso esta funcion centraliza los requisitos funcionales minimos
   * que debe cumplir una publicacion.
   */
  const titulo = String(datosClase?.titulo || '').trim();
  const descripcion = String(datosClase?.descripcion || '').trim();
  const fecha = normalizarFechaClase(datosClase?.fecha);
  const modalidad = String(datosClase?.modalidad || 'virtual').trim().toLowerCase();
  const id_materia = Number(datosClase?.id_materia || datosClase?.materiaId);
  const precio = normalizarNumero(datosClase?.precio, 'Debes ingresar un precio valido para la clase.');
  const ubicacion = String(datosClase?.ubicacion || '').trim();
  const origenCupo = datosClase?.cupo_maximo ?? datosClase?.cupoMaximo ?? 1;
  const cupo_maximo = normalizarNumero(origenCupo, 'Debes indicar un cupo maximo valido.');

  if (!titulo || !descripcion) {
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
    async crearClase(datosClase) {
      // Solo un mentor valido puede publicar. Ademas, la materia elegida debe
      // pertenecer a su perfil academico para evitar publicaciones inconsistentes.
      const datosClaseValidada = validarDatosClase(datosClase);
      const id_mentor = Number(datosClase?.id_mentor || datosClase?.mentorId);

      if (!id_mentor) {
        throw crearErrorApp('Debes indicar el mentor creador.', 'VALIDATION_ERROR');
      }

      const mentor = await usuarioRepository.buscarPorId(id_mentor);
      if (!mentor || mentor.rol !== 'mentor') {
        throw crearErrorApp('Solo un mentor puede crear clases.', 'FORBIDDEN');
      }

      const materiaPerteneceAlMentor = await mentorMateriaRepository.existe(
        id_mentor,
        datosClaseValidada.id_materia
      );
      if (!materiaPerteneceAlMentor) {
        throw crearErrorApp('La materia seleccionada no pertenece a las materias registradas por el mentor.', 'FORBIDDEN');
      }

      return claseRepository.crearClase({
        ...datosClaseValidada,
        id_mentor,
      });
    },

    async listarClases(filtros = {}) {
      // El service conserva una interfaz simple para el controller y delega la
      // lectura concreta al repository.
      return claseRepository.buscarTodas(filtros);
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
      const mentor = await usuarioRepository.buscarPorId(id_mentor);
      if (!mentor || mentor.rol !== 'mentor') {
        throw crearErrorApp('Mentor no encontrado.', 'NOT_FOUND');
      }
      return claseRepository.buscarPorMentor(id_mentor);
    },

    async actualizarClase(id, datosClase) {
      // Se preserva la autoria: solo el mentor creador puede modificar la clase.
      const datosClaseValidada = validarDatosClase(datosClase);
      const id_mentor = Number(datosClase?.id_mentor || datosClase?.mentorId);
      const clase = await claseRepository.buscarPorId(id);

      if (!clase) {
        throw crearErrorApp('Clase no encontrada.', 'NOT_FOUND');
      }
      if (!id_mentor || id_mentor !== clase.mentorId) {
        throw crearErrorApp('Solo el mentor creador puede editar esta clase.', 'FORBIDDEN');
      }
      if (datosClaseValidada.cupo_maximo < clase.cupoActual) {
        throw crearErrorApp('El cupo maximo no puede ser menor al cupo actual.', 'VALIDATION_ERROR');
      }

      const materiaPerteneceAlMentor = await mentorMateriaRepository.existe(
        id_mentor,
        datosClaseValidada.id_materia
      );
      if (!materiaPerteneceAlMentor) {
        throw crearErrorApp('La materia seleccionada no pertenece a las materias registradas por el mentor.', 'FORBIDDEN');
      }

      return claseRepository.actualizarClase(id, datosClaseValidada);
    },

    async eliminarClase(id, datosClase) {
      // El mismo control de propiedad se aplica al borrado para que un mentor
      // no pueda eliminar clases creadas por otra persona.
      const id_mentor = Number(datosClase?.id_mentor || datosClase?.mentorId);
      const clase = await claseRepository.buscarPorId(id);

      if (!clase) {
        throw crearErrorApp('Clase no encontrada.', 'NOT_FOUND');
      }
      if (!id_mentor || id_mentor !== clase.mentorId) {
        throw crearErrorApp('Solo el mentor creador puede eliminar esta clase.', 'FORBIDDEN');
      }

      return claseRepository.eliminarClase(id);
    },
  };
}

module.exports = {
  crearServicioClase,
};
