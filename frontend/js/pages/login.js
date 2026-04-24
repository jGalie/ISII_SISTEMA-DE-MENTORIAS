(async function () {
  const form = document.getElementById('login-form');
  const alertBox = document.getElementById('login-alert');
  const btn = document.getElementById('btn-login');
  const passwordInput = document.getElementById('password');
  const togglePasswordButton = document.getElementById('toggle-password');
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');

  function getStoredUser(store) {
    if (!store) return null;
    try {
      const user = JSON.parse(store.getItem('usuarioLogueado') || 'null');
      return user && user.id && user.email ? user : null;
    } catch {
      return null;
    }
  }

  function getAuthenticatedUser() {
    const user = MentoriasAuth.getUser();
    return (user && user.id && user.email) || null
      ? user
      : getStoredUser(window.sessionStorage);
  }

  function getLoggedHomePath(user) {
    if (user.rol === 'mentor') return '/pages/dashboard.html';
    if (user.rol === 'estudiante') return '/pages/clases.html';
    return '/index.html';
  }

  const currentUser = getAuthenticatedUser();
  if (currentUser) {
    window.location.href = getLoggedHomePath(currentUser);
    return;
  }

  function showError(message) {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.classList.remove('d-none');
  }

  function hideError() {
    if (!alertBox) return;
    alertBox.classList.add('d-none');
  }

  function setFieldError(input, box, message) {
    if (!input || !box) return;
    input.classList.add('is-invalid');
    box.textContent = message;
    box.classList.remove('d-none');
  }

  function clearFieldError(input, box) {
    if (!input || !box) return;
    input.classList.remove('is-invalid');
    box.classList.add('d-none');
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function validateForm() {
    let ok = true;
    const email = emailInput?.value.trim() || '';
    const password = passwordInput?.value || '';

    clearFieldError(emailInput, emailError);
    clearFieldError(passwordInput, passwordError);

    if (!email) {
      setFieldError(emailInput, emailError, 'Ingresa tu email.');
      ok = false;
    } else if (!isValidEmail(email)) {
      setFieldError(emailInput, emailError, 'Ingresa un email valido.');
      ok = false;
    }

    if (!password) {
      setFieldError(passwordInput, passwordError, 'Ingresa tu contrasena.');
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
    hideError();
    if (!validateForm()) return;

    const payload = {
      email: emailInput.value,
      password: passwordInput.value,
    };

    try {
      if (btn) btn.disabled = true;
      if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Ingresando...';
      const { data } = await MentoriasApi.login(payload);
      MentoriasAuth.setUser(data);
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      window.location.href = next || getLoggedHomePath(data);
    } catch (err) {
      showError(err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Iniciar Sesion';
      }
    }
  });
})();
