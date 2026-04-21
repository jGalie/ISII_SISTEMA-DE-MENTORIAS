(async function () {
  const form = document.getElementById('register-form');
  const alertBox = document.getElementById('register-alert');
  const okBox = document.getElementById('register-ok');
  const btn = document.getElementById('btn-register');

  const nombreEl = document.getElementById('nombre');
  const emailEl = document.getElementById('email');
  const rolEl = document.getElementById('rol');
  const passEl = document.getElementById('password');
  const passConfirmEl = document.getElementById('password-confirm');
  const mentorFields = document.getElementById('mentor-fields');
  const materiasContainer = document.getElementById('materias-container');
  const otrasMateriasEl = document.getElementById('otras-materias');
  const emailFeedback = document.getElementById('email-feedback');
  const passwordMatchFeedback = document.getElementById('password-match-feedback');

  const chkLen = document.getElementById('chk-len');
  const chkLetter = document.getElementById('chk-letter');
  const chkNumber = document.getElementById('chk-number');
  const chkMatch = document.getElementById('chk-match');

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

  function normalize(value) {
    return String(value || '').trim();
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
      if (icon) icon.textContent = 'OK';
      return;
    }
    if (status === 'invalid') {
      element.classList.add('is-invalid');
      if (icon) icon.textContent = 'X';
      return;
    }
    if (icon) icon.textContent = '*';
  }

  function getSelectedMaterias() {
    return Array.from(document.querySelectorAll('input[name="materia"]:checked')).map((input) => input.value);
  }

  function getSelectedLevels() {
    return Array.from(document.querySelectorAll('input[name="nivel-educativo"]:checked')).map((input) => input.value);
  }

  function updateChecklist() {
    const password = String(passEl?.value || '');
    const passwordConfirm = String(passConfirmEl?.value || '');
    const hasStarted = password.length > 0 || passwordConfirm.length > 0;
    const minLen = password.length >= 8;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const matches = password.length > 0 && password === passwordConfirm;

    setChecklistState(chkLen, hasStarted ? (minLen ? 'valid' : 'invalid') : 'idle');
    setChecklistState(chkLetter, hasStarted ? (hasLetter ? 'valid' : 'invalid') : 'idle');
    setChecklistState(chkNumber, hasStarted ? (hasNumber ? 'valid' : 'invalid') : 'idle');
    setChecklistState(chkMatch, hasStarted ? (matches ? 'valid' : 'invalid') : 'idle');

    if (passwordMatchFeedback) {
      const shouldShow = passwordConfirm.length > 0 && !matches;
      passwordMatchFeedback.classList.toggle('is-visible', shouldShow);
    }

    if (passConfirmEl) {
      passConfirmEl.classList.toggle('is-invalid', passwordConfirm.length > 0 && !matches);
      passConfirmEl.classList.toggle('is-valid', matches);
    }

    return { ok: minLen && hasLetter && hasNumber && matches };
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

  function updateMentorFields() {
    const isMentor = rolEl && rolEl.value === 'mentor';
    mentorFields?.classList.toggle('d-none', !isMentor);
  }

  function bindPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach((button) => {
      button.addEventListener('click', function () {
        const input = document.getElementById(this.getAttribute('data-target'));
        const icon = this.querySelector('i');
        if (!input) return;

        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        if (icon) {
          icon.className = isHidden ? 'bi bi-eye-slash' : 'bi bi-eye';
        }
      });
    });
  }

  function renderMaterias(materias) {
    if (!materiasContainer) return;

    materiasContainer.innerHTML = materias
      .map(
        (materia) => `
          <label class="chip-option">
            <input type="checkbox" name="materia" value="${materia.nombre}" />
            <span>${materia.nombre}</span>
          </label>
        `
      )
      .join('');
  }

  async function loadMaterias() {
    try {
      const response = await MentoriasApi.getMaterias();
      const materias = Array.isArray(response.data) ? response.data : [];
      renderMaterias(materias);
    } catch (error) {
      renderMaterias([]);
      if (materiasContainer) {
        materiasContainer.innerHTML = '<div class="text-muted small">No se pudieron cargar las materias predefinidas.</div>';
      }
    }
  }

  if (passEl) passEl.addEventListener('input', updateChecklist);
  if (passConfirmEl) passConfirmEl.addEventListener('input', updateChecklist);
  if (emailEl) emailEl.addEventListener('input', updateEmailValidity);
  if (rolEl) rolEl.addEventListener('change', updateMentorFields);

  bindPasswordToggles();
  updateChecklist();
  updateMentorFields();
  await loadMaterias();

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailOk = updateEmailValidity();
    const passPolicy = updateChecklist();
    const rol = String(rolEl?.value || 'estudiante');
    const materias = getSelectedMaterias();
    const nivelesEducativos = getSelectedLevels();

    if (!emailOk) {
      showError('Email invalido.');
      return;
    }
    if (!passPolicy.ok) {
      showError('La contrasena no cumple los requisitos o no coincide.');
      return;
    }

    const payload = {
      nombre: normalize(nombreEl?.value),
      email: normalize(emailEl?.value),
      password: String(passEl?.value || ''),
      rol,
      materias,
      otrasMaterias: normalize(otrasMateriasEl?.value),
      nivelesEducativos,
    };

    if (!payload.nombre) {
      showError('Campo obligatorio: nombre');
      return;
    }

    if (rol === 'mentor') {
      const customSubjects = payload.otrasMaterias
        ? payload.otrasMaterias.split(',').map((item) => item.trim()).filter(Boolean)
        : [];

      if (materias.length === 0 && customSubjects.length === 0) {
        showError('Selecciona o escribe al menos una materia para el mentor.');
        return;
      }
      if (nivelesEducativos.length === 0) {
        showError('Selecciona al menos un nivel educativo para el mentor.');
        return;
      }
    }

    try {
      if (btn) btn.disabled = true;
      await MentoriasApi.register(payload);
      showOk('Registro exitoso. Ahora puedes iniciar sesion.');
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
