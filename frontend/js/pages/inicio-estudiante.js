(async function () {
  if (!MentoriasAuth.requerirAutenticacion()) return;

  const user = MentoriasAuth.obtenerUsuario();
  if (!user || user.rol !== 'estudiante') {
    window.location.href = MentoriasAuth.obtenerRutaInicio(user);
    return;
  }

  const welcome = document.getElementById('student-home-welcome');
  const menuName = document.getElementById('student-menu-name');
  const menuEmail = document.getElementById('student-menu-email');
  const logoutButton = document.getElementById('student-cerrarSesion');

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
    logoutButton.addEventListener('click', async function () {
      const confirmarSalida = await MentoriasUI.mostrarDialogoConfirmacion({
        title: 'Cerrar sesion',
        message: 'Queres cerrar tu sesion en Mentorix?',
        confirmText: 'Cerrar sesion',
        cancelText: 'Cancelar',
      });
      if (!confirmarSalida) return;
      MentoriasAuth.cerrarSesion();
      window.location.href = '/index.html';
    });
  }
})();
