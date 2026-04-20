/**
 * Sesion cliente simple basada en localStorage.
 * Clave: "usuarioLogueado"
 */
(function (global) {
  const KEY = 'usuarioLogueado';

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

  function requireAuth({ redirectTo = '/pages/login.html' } = {}) {
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
    isAuthenticated,
    requireAuth,
    clear: logout,
    isLoggedIn: isAuthenticated,
  };
})(window);
