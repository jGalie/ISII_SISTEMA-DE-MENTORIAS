(async function () {
  const form = document.getElementById('login-form');
  const alertBox = document.getElementById('login-alert');
  const btn = document.getElementById('btn-login');
  const passwordInput = document.getElementById('password');
  const togglePasswordButton = document.getElementById('toggle-password');

  function showError(message) {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.classList.remove('d-none');
  }

  function hideError() {
    if (!alertBox) return;
    alertBox.classList.add('d-none');
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

    const payload = {
      email: (document.getElementById('email') || {}).value,
      password: (document.getElementById('password') || {}).value,
    };

    try {
      if (btn) btn.disabled = true;
      const { data } = await MentoriasApi.login(payload);
      MentoriasAuth.setUser(data);
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      window.location.href = next || MentoriasAuth.getHomePath(data);
    } catch (err) {
      showError(err.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  });
})();
