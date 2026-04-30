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
  const passwordFeedback = document.getElementById('password-error');
  const passwordMatchFeedback = document.getElementById('password-match-feedback');
  const studentLevelsFeedback = document.getElementById('student-levels-error');
  const mentorLevelsFeedback = document.getElementById('mentor-levels-error');
  const materiasFeedback = document.getElementById('materias-error');

  const chkLen = document.getElementById('chk-len');
  const chkLetter = document.getElementById('chk-letter');
  const chkNumber = document.getElementById('chk-number');
  const chkMatch = document.getElementById('chk-match');

  const allMaterias = [];
  const selectedMaterias = new Set();

  function mostrarError(message) {
    if (alertBox) {
      alertBox.textContent = message;
      alertBox.classList.remove('d-none');
    }
    if (okBox) okBox.classList.add('d-none');
  }

  function mostrarOk(message) {
    if (okBox) {
      okBox.textContent = message;
      okBox.classList.remove('d-none');
    }
    if (alertBox) alertBox.classList.add('d-none');
  }

  function normalizar(value) {
    return String(value || '').trim();
  }

  function normalizarClave(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function esEmailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  }

  function establecerEstadoChecklist(element, status) {
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

  function obtenerMateriasSeleccionadas() {
    return Array.from(selectedMaterias.values());
  }

  function obtenerNivelesSeleccionados() {
    const role = String(rolEl?.value || 'estudiante');
    const selector =
      role === 'mentor' ? 'input[name="nivel-educativo"]:checked' : 'input[name="nivel-estudiante"]:checked';
    return Array.from(document.querySelectorAll(selector)).map((input) => input.value);
  }

  function actualizarEstadosChips() {
    document.querySelectorAll('.chip-option').forEach((label) => {
      const input = label.querySelector('input[type="checkbox"]');
      if (!input) return;
      label.classList.toggle('is-selected', Boolean(input.checked));
    });
  }

  function renderizarMateriasSeleccionadas() {
    if (!materiasSelectedEl) return;

    const values = obtenerMateriasSeleccionadas();
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

  function renderizarMaterias() {
    if (!materiasContainer) return;

    const searchValue = normalizarClave(materiasSearchEl?.value);
    const filtered = allMaterias.filter((materia) =>
      !searchValue || normalizarClave(materia.nombre).includes(searchValue)
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

  function actualizarChecklist() {
    const password = String(passEl?.value || '');
    const passwordConfirm = String(passConfirmEl?.value || '');
    const hasStarted = password.length > 0 || passwordConfirm.length > 0;
    const minLen = password.length >= 8;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const matches = password.length > 0 && password === passwordConfirm;

    establecerEstadoChecklist(chkLen, hasStarted ? (minLen ? 'valid' : 'invalid') : 'idle');
    establecerEstadoChecklist(chkLetter, hasStarted ? (hasLetter ? 'valid' : 'invalid') : 'idle');
    establecerEstadoChecklist(chkNumber, hasStarted ? (hasNumber ? 'valid' : 'invalid') : 'idle');
    establecerEstadoChecklist(chkMatch, hasStarted ? (matches ? 'valid' : 'invalid') : 'idle');

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

  function actualizarCamposPassword(force = false) {
    const password = String(passEl?.value || '');
    const passwordConfirm = String(passConfirmEl?.value || '');
    const hasPasswordError = force && !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
    const hasConfirmError = force && (!passwordConfirm || password !== passwordConfirm);

    passEl?.classList.toggle('is-invalid', hasPasswordError);
    passEl?.closest('.input-shell')?.classList.toggle('is-invalid', hasPasswordError);
    passConfirmEl?.classList.toggle('is-invalid', hasConfirmError);
    passConfirmEl?.closest('.input-shell')?.classList.toggle('is-invalid', hasConfirmError);

    passwordFeedback?.classList.toggle('is-visible', hasPasswordError);
    passwordMatchFeedback?.classList.toggle('is-visible', hasConfirmError);
  }

  function actualizarValidezEmail() {
    if (!emailEl) return true;
    const value = normalizar(emailEl.value);
    const ok = esEmailValido(value);
    const shouldShow = value !== '';

    emailEl.classList.toggle('is-invalid', shouldShow && !ok);
    emailEl.classList.toggle('is-valid', shouldShow && ok);
    emailEl.closest('.input-shell')?.classList.toggle('is-invalid', shouldShow && !ok);

    if (emailFeedback) {
      emailFeedback.classList.toggle('is-visible', shouldShow && !ok);
    }

    return ok;
  }

  function actualizarInputRequerido(input, feedback, message) {
    if (!input) return true;
    const ok = normalizar(input.value) !== '';
    input.classList.toggle('is-invalid', !ok);
    input.classList.toggle('is-valid', ok);
    input.closest('.input-shell')?.classList.toggle('is-invalid', !ok);
    if (feedback) {
      feedback.textContent = message;
      feedback.classList.toggle('is-visible', !ok);
    }
    return ok;
  }

  function actualizarValidacionGrupo(panel, feedback, ok) {
    panel?.classList.toggle('is-invalid', !ok);
    feedback?.classList.toggle('is-visible', !ok);
    return ok;
  }

  function actualizarCamposRol() {
    const isMentor = rolEl && rolEl.value === 'mentor';
    studentFields?.classList.toggle('d-none', isMentor);
    mentorFields?.classList.toggle('d-none', !isMentor);
    studentFields?.querySelector('.mentor-panel')?.classList.remove('is-invalid');
    mentorFields?.querySelectorAll('.mentor-panel').forEach((panel) => panel.classList.remove('is-invalid'));
    studentLevelsFeedback?.classList.remove('is-visible');
    mentorLevelsFeedback?.classList.remove('is-visible');
    materiasFeedback?.classList.remove('is-visible');
  }

  function vincularTogglesPassword() {
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

  function sincronizarMateriasSeleccionadasDesdeInput(input) {
    const value = normalizar(input.value);
    if (!value) return;

    if (input.checked) {
      selectedMaterias.add(value);
    } else {
      selectedMaterias.delete(value);
    }

    renderizarMateriasSeleccionadas();
    actualizarEstadosChips();
    actualizarValidacionGrupo(mentorFields?.querySelectorAll('.mentor-panel')[0], materiasFeedback, obtenerMateriasSeleccionadas().length > 0 || normalizar(otrasMateriasEl?.value) !== '');
  }

  async function cargarMaterias() {
    try {
      const response = await MentoriasApi.obtenerMaterias();
      const materias = Array.isArray(response.data) ? response.data : [];
      allMaterias.splice(0, allMaterias.length, ...materias);
      renderizarMaterias();
      renderizarMateriasSeleccionadas();
    } catch (error) {
      if (materiasContainer) {
        materiasContainer.innerHTML = '<div class="text-muted small">No se pudieron cargar las materias predefinidas.</div>';
      }
    }
  }

  if (passEl) passEl.addEventListener('input', () => {
    actualizarChecklist();
    actualizarCamposPassword(false);
  });
  if (passConfirmEl) passConfirmEl.addEventListener('input', () => {
    actualizarChecklist();
    actualizarCamposPassword(false);
  });
  if (emailEl) emailEl.addEventListener('input', actualizarValidezEmail);
  if (nombreEl) nombreEl.addEventListener('input', () => actualizarInputRequerido(nombreEl, nombreFeedback, 'Ingresa tu nombre.'));
  if (rolEl) rolEl.addEventListener('change', actualizarCamposRol);
  if (materiasSearchEl) {
    materiasSearchEl.addEventListener('input', renderizarMaterias);
  }
  if (otrasMateriasEl) {
    otrasMateriasEl.addEventListener('input', () => {
      actualizarValidacionGrupo(mentorFields?.querySelectorAll('.mentor-panel')[0], materiasFeedback, obtenerMateriasSeleccionadas().length > 0 || normalizar(otrasMateriasEl.value) !== '');
    });
  }
  if (materiasContainer) {
    materiasContainer.addEventListener('change', function (event) {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.name !== 'materia') return;
      sincronizarMateriasSeleccionadasDesdeInput(input);
    });
  }
  if (materiasSelectedEl) {
    materiasSelectedEl.addEventListener('click', function (event) {
      const button = event.target.closest('[data-remove-materia]');
      if (!button) return;
      const value = normalizar(button.getAttribute('data-remove-materia'));
      if (!value) return;
      selectedMaterias.delete(value);
      renderizarMaterias();
      renderizarMateriasSeleccionadas();
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
    actualizarEstadosChips();
    const role = String(rolEl?.value || 'estudiante');
    if (role === 'estudiante') {
      actualizarValidacionGrupo(studentFields?.querySelector('.mentor-panel'), studentLevelsFeedback, obtenerNivelesSeleccionados().length > 0);
    } else {
      actualizarValidacionGrupo(mentorFields?.querySelectorAll('.mentor-panel')[1], mentorLevelsFeedback, obtenerNivelesSeleccionados().length > 0);
    }
  });

  vincularTogglesPassword();
  actualizarChecklist();
  actualizarCamposRol();
  await cargarMaterias();
  actualizarEstadosChips();

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailOk = actualizarValidezEmail();
    const nombreOk = actualizarInputRequerido(nombreEl, nombreFeedback, 'Ingresa tu nombre.');
    const passPolicy = actualizarChecklist();
    actualizarCamposPassword(true);
    const rol = String(rolEl?.value || 'estudiante');
    const materias = obtenerMateriasSeleccionadas();
    const nivelesEducativos = obtenerNivelesSeleccionados();
    const customSubjects = normalizar(otrasMateriasEl?.value)
      ? normalizar(otrasMateriasEl?.value).split(',').map((item) => item.trim()).filter(Boolean)
      : [];
    const studentLevelsOk = rol !== 'estudiante' || nivelesEducativos.length > 0;
    const mentorSubjectsOk = rol !== 'mentor' || materias.length > 0 || customSubjects.length > 0;
    const mentorLevelsOk = rol !== 'mentor' || nivelesEducativos.length > 0;

    actualizarValidacionGrupo(studentFields?.querySelector('.mentor-panel'), studentLevelsFeedback, studentLevelsOk);
    actualizarValidacionGrupo(mentorFields?.querySelectorAll('.mentor-panel')[0], materiasFeedback, mentorSubjectsOk);
    actualizarValidacionGrupo(mentorFields?.querySelectorAll('.mentor-panel')[1], mentorLevelsFeedback, mentorLevelsOk);

    if (!nombreOk || !studentLevelsOk || !mentorSubjectsOk || !mentorLevelsOk) {
      mostrarError('Debes completar todos los campos obligatorios.');
      return;
    }
    if (!emailOk) {
      mostrarError('Email invalido.');
      return;
    }
    if (!passPolicy.ok) {
      mostrarError('La contrasena no cumple los requisitos o no coincide.');
      return;
    }

    const payload = {
      nombre: normalizar(nombreEl?.value),
      email: normalizar(emailEl?.value),
      password: String(passEl?.value || ''),
      rol,
      materias,
      otrasMaterias: normalizar(otrasMateriasEl?.value),
      nivelesEducativos,
    };

    if (!payload.nombre) {
      mostrarError('Campo obligatorio: nombre');
      return;
    }

    if (rol === 'mentor') {
      if (materias.length === 0 && customSubjects.length === 0) {
        mostrarError('Selecciona o escribe al menos una materia para el mentor.');
        return;
      }
      if (nivelesEducativos.length === 0) {
        mostrarError('Selecciona al menos un nivel educativo para el mentor.');
        return;
      }
    } else if (nivelesEducativos.length === 0) {
      mostrarError('Selecciona al menos un nivel educativo de interes para el estudiante.');
      return;
    }

    try {
      if (btn) btn.disabled = true;
      if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Registrando...';
      await MentoriasApi.registrar(payload);
      mostrarOk('Registro exitoso. Ahora puedes iniciar sesion.');
      setTimeout(() => {
        window.location.href = '/pages/login.html';
      }, 700);
    } catch (err) {
      mostrarError(err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Registrarme';
      }
    }
  });
})();
