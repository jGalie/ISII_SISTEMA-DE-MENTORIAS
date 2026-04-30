(async function () {
  if (!MentoriasAuth.requerirAutenticacion()) return;
  await MentoriasUI.montarNavbar();

  const user = MentoriasAuth.obtenerUsuario();
  const form = document.getElementById('profile-form');
  const msg = document.getElementById('profile-msg');
  const saveButton = document.getElementById('btn-save-profile');
  const mentorFields = document.getElementById('mentor-profile-fields');
  const materiasContainer = document.getElementById('profile-materias-container');
  const otrasMateriasEl = document.getElementById('profile-otras-materias');
  const subtitle = document.getElementById('profile-subtitle');
  let formDirty = false;
  let allowNavigation = false;

  function mostrarMensaje(type, text) {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove('d-none');
  }

  function confirmarSalida() {
    if (!formDirty) return Promise.resolve(true);
    return MentoriasUI.mostrarDialogoConfirmacion({
      title: 'Cambios sin guardar',
      message: 'Tenes cambios sin guardar. Queres salir sin guardar?',
      confirmText: 'Salir sin guardar',
      cancelText: 'Seguir editando',
    });
  }

  function establecerErrorCampo(inputId, message) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(`${inputId}-error`);
    if (input) input.classList.add('is-invalid');
    if (box) {
      box.textContent = message;
      box.classList.remove('d-none');
    }
  }

  function limpiarErrorCampo(inputId) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(`${inputId}-error`);
    if (input) input.classList.remove('is-invalid');
    if (box) box.classList.add('d-none');
  }

  function renderizarMaterias(materias, selectedNames = []) {
    if (!materiasContainer) return;
    const selected = new Set(selectedNames.map((item) => String(item).toLowerCase()));

    materiasContainer.innerHTML = materias
      .map(
        (materia) => `
          <label class="chip-option">
            <input type="checkbox" name="profile-materia" value="${materia.nombre}" ${selected.has(String(materia.nombre).toLowerCase()) ? 'checked' : ''} />
            <span>${materia.nombre}</span>
          </label>
        `
      )
      .join('');
  }

  function obtenerMateriasSeleccionadas() {
    return Array.from(document.querySelectorAll('input[name="profile-materia"]:checked')).map((input) => input.value);
  }

  function obtenerNivelesSeleccionados() {
    return Array.from(document.querySelectorAll('input[name="profile-nivel"]:checked')).map((input) => input.value);
  }

  try {
    const [profileResponse, materiasResponse] = await Promise.all([
      MentoriasApi.obtenerUsuario(user.id),
      MentoriasApi.obtenerMaterias(),
    ]);

    const profile = profileResponse.data || user;
    const materias = Array.isArray(materiasResponse.data) ? materiasResponse.data : [];

    document.getElementById('profile-nombre').value = profile.nombre || '';
    document.getElementById('profile-email').value = profile.email || '';
    document.getElementById('profile-ubicacion').value = profile.ubicacion || '';
    document.getElementById('profile-telefono').value = profile.telefono || '';

    if (profile.rol === 'mentor') {
      mentorFields.classList.remove('d-none');
      subtitle.textContent = 'Actualiza tus datos, materias y niveles educativos.';
      document.getElementById('profile-mentor-bio').value = profile.mentorBio || '';
      document.getElementById('profile-mentor-experiencia').value = profile.mentorExperiencia || '';
      document.getElementById('profile-mentor-link').value = profile.mentorLink || '';

      const selectedNames = Array.isArray(profile.materias) ? profile.materias.map((item) => item.nombre) : [];
      renderizarMaterias(materias, selectedNames);

      const selectedLevels = new Set(Array.isArray(profile.nivelesEducativos) ? profile.nivelesEducativos : []);
      document.querySelectorAll('input[name="profile-nivel"]').forEach((input) => {
        input.checked = selectedLevels.has(input.value);
      });
    }
  } catch (error) {
    mostrarMensaje('danger', error.message);
    saveButton.disabled = true;
    return;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const payload = {
      actorId: user.id,
      nombre: document.getElementById('profile-nombre').value.trim(),
      email: document.getElementById('profile-email').value.trim(),
      ubicacion: document.getElementById('profile-ubicacion').value.trim(),
      telefono: document.getElementById('profile-telefono').value.trim(),
    };

    const passwordActual = document.getElementById('profile-current-password').value;
    const nuevaPassword = document.getElementById('profile-new-password').value;
    const confirmarPassword = document.getElementById('profile-confirm-password').value;

    if (passwordActual || nuevaPassword || confirmarPassword) {
      limpiarErrorCampo('profile-current-password');
      limpiarErrorCampo('profile-new-password');
      limpiarErrorCampo('profile-confirm-password');
      if (!passwordActual) {
        establecerErrorCampo('profile-current-password', 'Ingresa tu contrasena actual.');
        mostrarMensaje('danger', 'Debes completar todos los campos de seguridad.');
        return;
      }
      if (nuevaPassword.length < 8) {
        establecerErrorCampo('profile-new-password', 'La nueva contrasena debe tener al menos 8 caracteres.');
        mostrarMensaje('danger', 'La nueva contrasena debe tener al menos 8 caracteres.');
        return;
      }
      if (!/[A-Za-z]/.test(nuevaPassword) || !/\d/.test(nuevaPassword)) {
        establecerErrorCampo('profile-new-password', 'La nueva contrasena debe contener letras y numeros.');
        mostrarMensaje('danger', 'La nueva contrasena debe contener letras y numeros.');
        return;
      }
      if (nuevaPassword !== confirmarPassword) {
        establecerErrorCampo('profile-confirm-password', 'La confirmacion de contrasena no coincide.');
        mostrarMensaje('danger', 'La confirmacion de contrasena no coincide.');
        return;
      }

      payload.passwordActual = passwordActual;
      payload.nuevaPassword = nuevaPassword;
    }

    if (user.rol === 'mentor') {
      payload.materias = obtenerMateriasSeleccionadas();
      payload.otrasMaterias = otrasMateriasEl.value.trim();
      payload.nivelesEducativos = obtenerNivelesSeleccionados();
      payload.mentorBio = document.getElementById('profile-mentor-bio').value.trim();
      payload.mentorExperiencia = document.getElementById('profile-mentor-experiencia').value.trim();
      payload.mentorLink = document.getElementById('profile-mentor-link').value.trim();
    }

    try {
      saveButton.disabled = true;
      mostrarMensaje('info', 'Guardando cambios...');
      const response = await MentoriasApi.actualizarUsuario(user.id, payload);
      const updatedUser = response.data;
      MentoriasAuth.guardarUsuario(updatedUser);
      formDirty = false;
      document.getElementById('profile-current-password').value = '';
      document.getElementById('profile-new-password').value = '';
      document.getElementById('profile-confirm-password').value = '';
      mostrarMensaje('success', 'Perfil actualizado correctamente.');
    } catch (error) {
      mostrarMensaje('danger', error.message);
    } finally {
      saveButton.disabled = false;
    }
  });

  form.addEventListener('input', () => {
    formDirty = true;
  });
  form.addEventListener('change', () => {
    formDirty = true;
  });

  window.addEventListener('beforeunload', (event) => {
    if (!formDirty || allowNavigation) return;
    event.preventDefault();
    event.returnValue = '';
  });

  document.addEventListener('click', async (event) => {
    const link = event.target.closest('a[href]');
    if (!link || allowNavigation) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#') || link.target === '_blank') return;
    if (link.hasAttribute('data-back-link')) {
      event.preventDefault();
      if (!formDirty || (await confirmarSalida())) {
        allowNavigation = true;
        MentoriasUI.volverOAInicio(href);
      }
      return;
    }
    if (!formDirty) return;
    event.preventDefault();
    if (await confirmarSalida()) {
      allowNavigation = true;
      window.location.href = href;
      return;
    }
  });
})();
