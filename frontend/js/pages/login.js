(async function () {
  const form = document.getElementById('login-form');
  const alertBox = document.getElementById('login-alert');
  const btn = document.getElementById('btn-login');
  const passwordInput = document.getElementById('password');
  const togglePasswordButton = document.getElementById('toggle-password');
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');

  function obtenerUsuarioGuardado(store) {
    if (!store) return null;
    try {
      const user = JSON.parse(store.getItem('usuarioLogueado') || 'null');
      return user && user.id && user.email ? user : null;
    } catch {
      return null;
    }
  }

  function obtenerUsuarioAutenticado() {
    const user = MentoriasAuth.obtenerUsuario();
    return (user && user.id && user.email) || null
      ? user
      : obtenerUsuarioGuardado(window.sessionStorage);
  }

  function obtenerRutaInicioLogueado(user) {
    if (user.rol === 'mentor') return '/pages/dashboard.html';
    if (user.rol === 'estudiante') return '/pages/clases.html';
    return '/index.html';
  }

  const currentUser = obtenerUsuarioAutenticado();
  if (currentUser) {
    window.location.href = obtenerRutaInicioLogueado(currentUser);
    return;
  }

  function mostrarError(message) {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.classList.remove('d-none');
  }

  function ocultarError() {
    if (!alertBox) return;
    alertBox.classList.add('d-none');
  }

  function establecerErrorCampo(input, box, message) {
    if (!input || !box) return;
    input.classList.add('is-invalid');
    input.closest('.input-shell')?.classList.add('is-invalid');
    box.textContent = message;
    box.classList.remove('d-none');
    box.classList.add('is-visible');
  }

  function limpiarErrorCampo(input, box) {
    if (!input || !box) return;
    input.classList.remove('is-invalid');
    input.closest('.input-shell')?.classList.remove('is-invalid');
    box.classList.add('d-none');
    box.classList.remove('is-visible');
  }

  function esEmailValido(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function validarFormulario() {
    let ok = true;
    const email = emailInput?.value.trim() || '';
    const password = passwordInput?.value || '';

    limpiarErrorCampo(emailInput, emailError);
    limpiarErrorCampo(passwordInput, passwordError);

    if (!email) {
      establecerErrorCampo(emailInput, emailError, 'Ingresa tu email.');
      ok = false;
    } else if (!esEmailValido(email)) {
      establecerErrorCampo(emailInput, emailError, 'Ingresa un email valido.');
      ok = false;
    }

    if (!password) {
      establecerErrorCampo(passwordInput, passwordError, 'Ingresa tu contrasena.');
      ok = false;
    }

    return ok;
  }

  if (!form) return;

  if (togglePasswordButton && passwordInput) {
    togglePasswordButton.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePasswordButton.setAttribute('aria-pressed', String(isPassword));
      togglePasswordButton.setAttribute(
        'aria-label',
        isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
      );
      togglePasswordButton.innerHTML = isPassword
        ? '<i class="bi bi-eye-slash"></i>'
        : '<i class="bi bi-eye"></i>';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    ocultarError();
    if (!validarFormulario()) return;

    const payload = {
      email: emailInput.value,
      password: passwordInput.value,
    };

    try {
      if (btn) btn.disabled = true;
      if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Ingresando...';
      const { data } = await MentoriasApi.iniciarSesion(payload);
      MentoriasAuth.guardarUsuario(data);
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      window.location.href = next || obtenerRutaInicioLogueado(data);
    } catch (err) {
      mostrarError(err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Iniciar Sesion';
      }
    }
  });
})();
