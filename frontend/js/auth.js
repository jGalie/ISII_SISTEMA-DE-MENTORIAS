/**
 * Sesion cliente simple basada en localStorage.
 * Clave: "usuarioLogueado"
 */
(function (global) {
  const KEY = 'usuarioLogueado';

  /**
   * Este modulo resuelve la sesion del lado cliente para el MVP.
   * Con esto se puede adaptar la interfaz segun el rol autenticado
   * sin incorporar una infraestructura mas compleja.
   */

  function obtenerUsuario() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch {
      return null;
    }
  }

  function guardarUsuario(user) {
    localStorage.setItem(KEY, JSON.stringify(user));
  }

  function cerrarSesion() {
    localStorage.removeItem(KEY);
  }

  function estaAutenticado() {
    const user = obtenerUsuario();
    return Boolean(user && user.id && user.email);
  }

  function obtenerRutaInicio(user = obtenerUsuario()) {
    // La experiencia inicial cambia segun el rol para dirigir al usuario
    // hacia el flujo mas relevante dentro de la plataforma.
    if (!user) return '/index.html';
    if (user.rol === 'estudiante') return '/pages/inicio-estudiante.html';
    if (user.rol === 'mentor') return '/pages/dashboard.html';
    return '/index.html';
  }

  function requerirAutenticacion({ redirectTo = '/pages/login.html' } = {}) {
    // Se conserva la ruta actual para poder retomarla despues del login.
    if (!estaAutenticado()) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `${redirectTo}?next=${next}`;
      return false;
    }
    return true;
  }

  global.MentoriasAuth = {
    KEY,
    obtenerUsuario,
    guardarUsuario,
    cerrarSesion,
    obtenerRutaInicio,
    estaAutenticado,
    requerirAutenticacion,
    limpiar: cerrarSesion,
    estaLogueado: estaAutenticado,
  };
})(window);
