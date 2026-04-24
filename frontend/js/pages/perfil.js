(async function () {
  if (!MentoriasAuth.requireAuth()) return;
  await MentoriasUI.mountNavbar();

  const user = MentoriasAuth.getUser();
  const form = document.getElementById('profile-form');
  const msg = document.getElementById('profile-msg');
  const saveButton = document.getElementById('btn-save-profile');
  const mentorFields = document.getElementById('mentor-profile-fields');
  const materiasContainer = document.getElementById('profile-materias-container');
  const otrasMateriasEl = document.getElementById('profile-otras-materias');
  const subtitle = document.getElementById('profile-subtitle');

  function showMessage(type, text) {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove('d-none');
  }

  function renderMaterias(materias, selectedNames = []) {
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

  function getSelectedMaterias() {
    return Array.from(document.querySelectorAll('input[name="profile-materia"]:checked')).map((input) => input.value);
  }

  function getSelectedLevels() {
    return Array.from(document.querySelectorAll('input[name="profile-nivel"]:checked')).map((input) => input.value);
  }

  try {
    const [profileResponse, materiasResponse] = await Promise.all([
      MentoriasApi.getUsuario(user.id),
      MentoriasApi.getMaterias(),
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
      renderMaterias(materias, selectedNames);

      const selectedLevels = new Set(Array.isArray(profile.nivelesEducativos) ? profile.nivelesEducativos : []);
      document.querySelectorAll('input[name="profile-nivel"]').forEach((input) => {
        input.checked = selectedLevels.has(input.value);
      });
    }
  } catch (error) {
    showMessage('danger', error.message);
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
      if (nuevaPassword.length < 8) {
        showMessage('danger', 'La nueva contrasena debe tener al menos 8 caracteres.');
        return;
      }
      if (!/[A-Za-z]/.test(nuevaPassword) || !/\d/.test(nuevaPassword)) {
        showMessage('danger', 'La nueva contrasena debe contener letras y numeros.');
        return;
      }
      if (nuevaPassword !== confirmarPassword) {
        showMessage('danger', 'La confirmacion de contrasena no coincide.');
        return;
      }

      payload.passwordActual = passwordActual;
      payload.nuevaPassword = nuevaPassword;
    }

    if (user.rol === 'mentor') {
      payload.materias = getSelectedMaterias();
      payload.otrasMaterias = otrasMateriasEl.value.trim();
      payload.nivelesEducativos = getSelectedLevels();
      payload.mentorBio = document.getElementById('profile-mentor-bio').value.trim();
      payload.mentorExperiencia = document.getElementById('profile-mentor-experiencia').value.trim();
      payload.mentorLink = document.getElementById('profile-mentor-link').value.trim();
    }

    try {
      saveButton.disabled = true;
      showMessage('info', 'Guardando cambios...');
      const response = await MentoriasApi.updateUsuario(user.id, payload);
      const updatedUser = response.data;
      MentoriasAuth.setUser(updatedUser);
      document.getElementById('profile-current-password').value = '';
      document.getElementById('profile-new-password').value = '';
      document.getElementById('profile-confirm-password').value = '';
      showMessage('success', 'Perfil actualizado correctamente.');
    } catch (error) {
      showMessage('danger', error.message);
    } finally {
      saveButton.disabled = false;
    }
  });
})();
