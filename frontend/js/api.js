/**
 * Cliente HTTP mínimo para la API Express (misma origen).
 */
(function (global) {
  /**
   * Este modulo agrupa el acceso HTTP a la API para evitar repetir fetch en
   * cada pantalla.
   */
  /**
   * Este modulo cumple el rol de cliente de la API.
   * Su objetivo es que las paginas trabajen con funciones del dominio
   * y no con detalles repetidos de fetch, headers o manejo de errores.
   */
  async function parsearCuerpoRespuesta(res) {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  /**
   * Ejecuta una peticion HTTP y normaliza el manejo de errores. Esta decision
   * reduce duplicacion en las paginas y permite que la interfaz se concentre
   * en la interaccion con la persona usuaria.
   */
  async function pedirJson(path, options = {}) {
    // Se centraliza el tratamiento comun de todas las respuestas HTTP.
    const headers = {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(path, { ...options, headers });
    const body = await parsearCuerpoRespuesta(res);

    if (!res.ok) {
      const message = body && body.error ? body.error : res.statusText;
      throw new Error(message);
    }

    return body;
  }

  global.MentoriasApi = {
    /**
     * Operaciones publicas expuestas al resto del frontend. Las funciones de
     * clase se nombran en espanol para respetar el vocabulario del dominio.
     */
    // Aqui se expone una interfaz pequena pero expresiva para consumir
    // las funcionalidades principales del backend desde el frontend.
    obtenerClases(params = {}) {
      const search = new URLSearchParams();
      if (params.id_mentor) search.set('id_mentor', params.id_mentor);
      if (params.q) search.set('q', params.q);
      if (params.busqueda) search.set('busqueda', params.busqueda);
      if (params.modalidad) search.set('modalidad', params.modalidad);
      if (params.materia) search.set('materia', params.materia);
      if (params.id_materia) search.set('id_materia', params.id_materia);
      const suffix = search.toString() ? `?${search.toString()}` : '';
      return pedirJson(`/clases${suffix}`);
    },
    obtenerClase(id) {
      return pedirJson(`/clases/${encodeURIComponent(id)}`);
    },
    crearClase(payload) {
      return pedirJson('/clases', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    actualizarClase(id, payload) {
      return pedirJson(`/clases/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    eliminarClase(id, payload) {
      return pedirJson(`/clases/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        body: JSON.stringify(payload || {}),
      });
    },
    crearInscripcion(payload) {
      return pedirJson('/inscripciones', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    buscarInscripcionesDelEstudiante(id_usuario) {
      return pedirJson(`/inscripciones/usuario/${encodeURIComponent(id_usuario)}`);
    },
    buscarSolicitudesDelMentor(id_mentor) {
      return pedirJson(`/inscripciones/mentor/${encodeURIComponent(id_mentor)}`);
    },
    actualizarEstadoInscripcion(id_inscripcion, datosInscripcion) {
      return pedirJson(`/inscripciones/${encodeURIComponent(id_inscripcion)}/estado`, {
        method: 'PUT',
        body: JSON.stringify(datosInscripcion),
      });
    },
    obtenerMensajesInscripcion(id_inscripcion, id_usuario) {
      const search = new URLSearchParams();
      search.set('id_usuario', id_usuario);
      return pedirJson(`/inscripciones/${encodeURIComponent(id_inscripcion)}/mensajes?${search.toString()}`);
    },
    enviarMensajeInscripcion(id_inscripcion, payload) {
      return pedirJson(`/inscripciones/${encodeURIComponent(id_inscripcion)}/mensajes`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    listarSeguimientosPorInscripcion(id_inscripcion, id_usuario) {
      const search = new URLSearchParams();
      search.set('id_usuario', id_usuario);
      return pedirJson(`/seguimientos/inscripcion/${encodeURIComponent(id_inscripcion)}?${search.toString()}`);
    },
    registrarSeguimiento(body) {
      return pedirJson('/seguimientos', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    listarMaterialesPorClase(id_clase, id_usuario) {
      const search = new URLSearchParams();
      search.set('id_usuario', id_usuario);
      return pedirJson(`/materiales/clase/${encodeURIComponent(id_clase)}?${search.toString()}`);
    },
    crearMaterial(body) {
      return pedirJson('/materiales', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    obtenerUsuarios() {
      return pedirJson('/usuarios');
    },
    obtenerUsuario(id) {
      return pedirJson(`/usuarios/${encodeURIComponent(id)}`);
    },
    obtenerMentorPublico(id) {
      return pedirJson(`/usuarios/mentores/${encodeURIComponent(id)}/publico`);
    },
    actualizarUsuario(id, payload) {
      return pedirJson(`/usuarios/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    obtenerMaterias() {
      return pedirJson('/materias');
    },
    obtenerMateriasMentor(id_mentor) {
      return pedirJson(`/mentor-materias?id_mentor=${encodeURIComponent(id_mentor)}`);
    },
    registrar(payload) {
      return pedirJson('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    iniciarSesion(payload) {
      return pedirJson('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    crearValoracion(payload) {
      return pedirJson('/valoraciones', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    obtenerValoracionesClase(id_clase) {
      return pedirJson(`/valoraciones/clase/${encodeURIComponent(id_clase)}`);
    },
    obtenerValoracionesMentor(id_mentor) {
      return pedirJson(`/valoraciones/mentor/${encodeURIComponent(id_mentor)}`);
    },
    pedirJson,
  };
})(window);
