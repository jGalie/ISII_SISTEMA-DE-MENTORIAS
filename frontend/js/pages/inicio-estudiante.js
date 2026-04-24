(function () {
  if (!MentoriasAuth.requireAuth()) return;

  const user = MentoriasAuth.getUser();
  if (!user || user.rol !== 'estudiante') {
    window.location.href = MentoriasAuth.getHomePath(user);
    return;
  }

  const welcome = document.getElementById('student-home-welcome');
  const menuName = document.getElementById('student-menu-name');
  const menuEmail = document.getElementById('student-menu-email');
  const logoutButton = document.getElementById('student-logout');

  if (welcome) {
    welcome.textContent = `Hola, ${user.nombre}. Explorá clases disponibles e inscribite; tu solicitud quedará pendiente hasta que el mentor la apruebe.`;
  }

  if (menuName) {
    menuName.textContent = (user.nombre || 'Estudiante').split(' ')[0];
  }

  if (menuEmail) {
    menuEmail.textContent = user.email || 'Sesión estudiante';
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', function () {
      if (!window.confirm('Estas seguro de realizar esta accion?')) return;
      MentoriasAuth.logout();
      window.location.href = '/index.html';
    });
  }
})();
