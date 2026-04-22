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

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem(KEY, JSON.stringify(user));
  }

  function logout() {
    localStorage.removeItem(KEY);
  }

  function isAuthenticated() {
    const user = getUser();
    return Boolean(user && user.id && user.email);
  }

  function getHomePath(user = getUser()) {
    // La experiencia inicial cambia segun el rol para dirigir al usuario
    // hacia el flujo mas relevante dentro de la plataforma.
    if (!user) return '/index.html';
    if (user.rol === 'estudiante') return '/pages/inicio-estudiante.html';
    if (user.rol === 'mentor') return '/pages/dashboard.html';
    return '/index.html';
  }

  function requireAuth({ redirectTo = '/pages/login.html' } = {}) {
    // Se conserva la ruta actual para poder retomarla despues del login.
    if (!isAuthenticated()) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `${redirectTo}?next=${next}`;
      return false;
    }
    return true;
  }

  global.MentoriasAuth = {
    KEY,
    getUser,
    setUser,
    logout,
    getHomePath,
    isAuthenticated,
    requireAuth,
    clear: logout,
    isLoggedIn: isAuthenticated,
  };
})(window);
