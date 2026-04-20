/**
 * Cliente HTTP mínimo para la API Express (misma origen).
 */
(function (global) {
  async function parseBody(res) {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  async function apiJson(path, options = {}) {
    const headers = {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(path, { ...options, headers });
    const body = await parseBody(res);

    if (!res.ok) {
      const message = body && body.error ? body.error : res.statusText;
      throw new Error(message);
    }

    return body;
  }

  global.MentoriasApi = {
    getClases(params = {}) {
      const search = new URLSearchParams();
      if (params.id_mentor) search.set('id_mentor', params.id_mentor);
      const suffix = search.toString() ? `?${search.toString()}` : '';
      return apiJson(`/clases${suffix}`);
    },
    getClase(id) {
      return apiJson(`/clases/${encodeURIComponent(id)}`);
    },
    createClase(payload) {
      return apiJson('/clases', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    updateClase(id, payload) {
      return apiJson(`/clases/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    deleteClase(id, payload) {
      return apiJson(`/clases/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        body: JSON.stringify(payload || {}),
      });
    },
    createInscripcion(payload) {
      return apiJson('/inscripciones', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    getInscripcionesUsuario(idUsuario) {
      return apiJson(`/inscripciones/usuario/${encodeURIComponent(idUsuario)}`);
    },
    getInscripcionesMentor(idMentor) {
      return apiJson(`/inscripciones/mentor/${encodeURIComponent(idMentor)}`);
    },
    updateEstadoInscripcion(idInscripcion, payload) {
      return apiJson(`/inscripciones/${encodeURIComponent(idInscripcion)}/estado`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    getUsuarios() {
      return apiJson('/usuarios');
    },
    register(payload) {
      return apiJson('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    login(payload) {
      return apiJson('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    apiJson,
  };
})(window);
