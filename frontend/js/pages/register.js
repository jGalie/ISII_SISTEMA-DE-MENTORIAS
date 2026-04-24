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
  const studentFields = document.getElementById('student-fields');
  const mentorFields = document.getElementById('mentor-fields');
  const materiasContainer = document.getElementById('materias-container');
  const materiasSearchEl = document.getElementById('materias-search');
  const materiasSelectedEl = document.getElementById('materias-selected');
  const materiasEmptyEl = document.getElementById('materias-empty');
  const otrasMateriasEl = document.getElementById('otras-materias');
  const emailFeedback = document.getElementById('email-feedback');
  const nombreFeedback = document.getElementById('nombre-error');
  const passwordMatchFeedback = document.getElementById('password-match-feedback');

  const chkLen = document.getElementById('chk-len');
  const chkLetter = document.getElementById('chk-letter');
  const chkNumber = document.getElementById('chk-number');
  const chkMatch = document.getElementById('chk-match');

  const allMaterias = [];
  const selectedMaterias = new Set();

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

  function normalizeKey(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
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
    return Array.from(selectedMaterias.values());
  }

  function getSelectedLevels() {
    const role = String(rolEl?.value || 'estudiante');
    const selector =
      role === 'mentor' ? 'input[name="nivel-educativo"]:checked' : 'input[name="nivel-estudiante"]:checked';
    return Array.from(document.querySelectorAll(selector)).map((input) => input.value);
  }

  function updateChipStates() {
    document.querySelectorAll('.chip-option').forEach((label) => {
      const input = label.querySelector('input[type="checkbox"]');
      if (!input) return;
      label.classList.toggle('is-selected', Boolean(input.checked));
    });
  }

  function renderSelectedMaterias() {
    if (!materiasSelectedEl) return;

    const values = getSelectedMaterias();
    if (!values.length) {
      materiasSelectedEl.innerHTML = '<span class="empty-selected">Aun no seleccionaste materias.</span>';
      return;
    }

    materiasSelectedEl.innerHTML = values
      .map(
        (materia) => `
          <button type="button" class="selected-tag" data-remove-materia="${materia}">
            <span>${materia}</span>
            <i class="bi bi-x-lg"></i>
          </button>
        `
      )
      .join('');
  }

  function renderMaterias() {
    if (!materiasContainer) return;

    const searchValue = normalizeKey(materiasSearchEl?.value);
    const filtered = allMaterias.filter((materia) =>
      !searchValue || normalizeKey(materia.nombre).includes(searchValue)
    );

    materiasContainer.innerHTML = filtered
      .map((materia) => {
        const checked = selectedMaterias.has(materia.nombre);
        return `
          <label class="chip-option ${checked ? 'is-selected' : ''}">
            <input type="checkbox" name="materia" value="${materia.nombre}" ${checked ? 'checked' : ''} />
            <span>${materia.nombre}</span>
          </label>
        `;
      })
      .join('');

    if (materiasEmptyEl) {
      materiasEmptyEl.classList.toggle('d-none', filtered.length > 0);
    }
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

  function updateRequiredInput(input, feedback, message) {
    if (!input) return true;
    const ok = normalize(input.value) !== '';
    input.classList.toggle('is-invalid', !ok);
    input.classList.toggle('is-valid', ok);
    if (feedback) {
      feedback.textContent = message;
      feedback.classList.toggle('is-visible', !ok);
    }
    return ok;
  }

  function updateRoleFields() {
    const isMentor = rolEl && rolEl.value === 'mentor';
    studentFields?.classList.toggle('d-none', isMentor);
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

  function syncSelectedMateriasFromInput(input) {
    const value = normalize(input.value);
    if (!value) return;

    if (input.checked) {
      selectedMaterias.add(value);
    } else {
      selectedMaterias.delete(value);
    }

    renderSelectedMaterias();
    updateChipStates();
  }

  async function loadMaterias() {
    try {
      const response = await MentoriasApi.getMaterias();
      const materias = Array.isArray(response.data) ? response.data : [];
      allMaterias.splice(0, allMaterias.length, ...materias);
      renderMaterias();
      renderSelectedMaterias();
    } catch (error) {
      if (materiasContainer) {
        materiasContainer.innerHTML = '<div class="text-muted small">No se pudieron cargar las materias predefinidas.</div>';
      }
    }
  }

  if (passEl) passEl.addEventListener('input', updateChecklist);
  if (passConfirmEl) passConfirmEl.addEventListener('input', updateChecklist);
  if (emailEl) emailEl.addEventListener('input', updateEmailValidity);
  if (nombreEl) nombreEl.addEventListener('input', () => updateRequiredInput(nombreEl, nombreFeedback, 'Ingresa tu nombre.'));
  if (rolEl) rolEl.addEventListener('change', updateRoleFields);
  if (materiasSearchEl) {
    materiasSearchEl.addEventListener('input', renderMaterias);
  }
  if (materiasContainer) {
    materiasContainer.addEventListener('change', function (event) {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.name !== 'materia') return;
      syncSelectedMateriasFromInput(input);
    });
  }
  if (materiasSelectedEl) {
    materiasSelectedEl.addEventListener('click', function (event) {
      const button = event.target.closest('[data-remove-materia]');
      if (!button) return;
      const value = normalize(button.getAttribute('data-remove-materia'));
      if (!value) return;
      selectedMaterias.delete(value);
      renderMaterias();
      renderSelectedMaterias();
    });
  }
  document.addEventListener('change', function (event) {
    const input = event.target;
    if (
      !(input instanceof HTMLInputElement) ||
      (input.name !== 'nivel-educativo' && input.name !== 'nivel-estudiante')
    ) {
      return;
    }
    updateChipStates();
  });

  bindPasswordToggles();
  updateChecklist();
  updateRoleFields();
  await loadMaterias();
  updateChipStates();

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailOk = updateEmailValidity();
    const nombreOk = updateRequiredInput(nombreEl, nombreFeedback, 'Ingresa tu nombre.');
    const passPolicy = updateChecklist();
    const rol = String(rolEl?.value || 'estudiante');
    const materias = getSelectedMaterias();
    const nivelesEducativos = getSelectedLevels();

    if (!nombreOk) {
      showError('Debes completar todos los campos obligatorios.');
      return;
    }
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
    } else if (nivelesEducativos.length === 0) {
      showError('Selecciona al menos un nivel educativo de interes para el estudiante.');
      return;
    }

    try {
      if (btn) btn.disabled = true;
      if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Registrando...';
      await MentoriasApi.register(payload);
      showOk('Registro exitoso. Ahora puedes iniciar sesion.');
      setTimeout(() => {
        window.location.href = '/pages/login.html';
      }, 700);
    } catch (err) {
      showError(err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Registrarme';
      }
    }
  });
})();
