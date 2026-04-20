(async function () {
  const form = document.getElementById('register-form');
  const alertBox = document.getElementById('register-alert');
  const okBox = document.getElementById('register-ok');
  const btn = document.getElementById('btn-register');

  const nombreEl = document.getElementById('nombre');
  const emailEl = document.getElementById('email');
  const passEl = document.getElementById('password');
  const rolEl = document.getElementById('rol');
  const emailFeedback = document.getElementById('email-feedback');

  const chkLen = document.getElementById('chk-len');
  const chkLetter = document.getElementById('chk-letter');
  const chkNumber = document.getElementById('chk-number');

  function showError(message) {
    if (alertBox) {
      alertBox.textContent = message;
      alertBox.classList.remove('d-none');
    }
    if (okBox) okBox.classList.add('d-none');
  }

  function showOk(message) {
    if (okBox) {
      okBox.textContent = message;
      okBox.classList.remove('d-none');
    }
    if (alertBox) alertBox.classList.add('d-none');
  }

  function normalize(s) {
    return String(s || '').trim();
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  }

  function setChecklistState(element, status) {
    if (!element) return;
    const icon = element.querySelector('.status-icon');

    element.classList.remove('is-valid', 'is-invalid');
    if (status === 'valid') {
      element.classList.add('is-valid');
      if (icon) icon.textContent = '✓';
      return;
    }
    if (status === 'invalid') {
      element.classList.add('is-invalid');
      if (icon) icon.textContent = '✕';
      return;
    }
    if (icon) icon.textContent = '•';
  }

  function updateChecklist() {
    const password = String(passEl?.value || '');
    const hasStarted = password.length > 0;
    const minLen = password.length >= 8;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);

    setChecklistState(chkLen, hasStarted ? (minLen ? 'valid' : 'invalid') : 'idle');
    setChecklistState(chkLetter, hasStarted ? (hasLetter ? 'valid' : 'invalid') : 'idle');
    setChecklistState(chkNumber, hasStarted ? (hasNumber ? 'valid' : 'invalid') : 'idle');

    return { ok: minLen && hasLetter && hasNumber, minLen, hasLetter, hasNumber };
  }

  function updateEmailValidity() {
    if (!emailEl) return true;
    const value = normalize(emailEl.value);
    const ok = isValidEmail(value);
    const shouldShow = value !== '';

    emailEl.classList.toggle('is-invalid', shouldShow && !ok);
    emailEl.classList.toggle('is-valid', shouldShow && ok);

    if (emailFeedback) {
      emailFeedback.classList.toggle('is-visible', shouldShow && !ok);
    }

    return ok;
  }

  if (passEl) passEl.addEventListener('input', updateChecklist);
  if (emailEl) emailEl.addEventListener('input', updateEmailValidity);

  updateChecklist();

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailOk = updateEmailValidity();
    const passPolicy = updateChecklist();

    if (!emailOk) {
      showError('Email inválido.');
      return;
    }
    if (!passPolicy.ok) {
      showError('La contraseña no cumple los requisitos.');
      return;
    }

    const payload = {
      nombre: normalize(nombreEl?.value),
      email: normalize(emailEl?.value),
      password: String(passEl?.value || ''),
      rol: String(rolEl?.value || 'estudiante'),
    };

    if (!payload.nombre) {
      showError('Campo obligatorio: nombre');
      return;
    }

    try {
      if (btn) btn.disabled = true;
      await MentoriasApi.register(payload);
      showOk('Registro exitoso. Ahora puedes iniciar sesión.');
      setTimeout(() => {
        window.location.href = '/pages/login.html';
      }, 700);
    } catch (err) {
      showError(err.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  });
})();
