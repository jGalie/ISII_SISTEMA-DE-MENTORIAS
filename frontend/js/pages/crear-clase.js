(async function () {
  if (!MentoriasAuth.requireAuth()) return;
  await MentoriasUI.mountNavbar();

  const user = MentoriasAuth.getUser();
  if (!user || user.rol !== 'mentor') {
    window.location.href = '/index.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const classId = params.get('id');
  const isEdit = Boolean(classId);

  const form = document.getElementById('form-clase');
  const msg = document.getElementById('form-msg');
  const saveButton = document.getElementById('btn-guardar');
  const deleteButton = document.getElementById('btn-delete');
  const pageTitle = document.getElementById('page-title');
  const materiaSelect = document.getElementById('materia');
  const materiaHelp = document.getElementById('materia-help');

  function showMessage(type, text) {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove('d-none');
  }

  function toggleFormAvailability(enabled) {
    Array.from(form.elements).forEach((element) => {
      if (element === deleteButton) return;
      element.disabled = !enabled;
    });
  }

  function renderMaterias(items, selectedId) {
    if (!materiaSelect) return;

    if (!items.length) {
      materiaSelect.innerHTML = '<option value="">No tienes materias registradas</option>';
      toggleFormAvailability(false);
      if (materiaHelp) {
        materiaHelp.textContent = 'Primero debes registrarte como mentor con al menos una materia.';
      }
      return;
    }

    materiaSelect.innerHTML = items
      .map((item) => `<option value="${item.materiaId || item.id}" ${Number(selectedId) === Number(item.materiaId || item.id) ? 'selected' : ''}>${item.materiaNombre || item.nombre}</option>`)
      .join('');

    toggleFormAvailability(true);
  }

  let materiasMentor = [];
  let currentClase = null;

  try {
    const materiasResponse = await MentoriasApi.getMentorMaterias(user.id);
    materiasMentor = Array.isArray(materiasResponse.data) ? materiasResponse.data : [];

    if (isEdit) {
      pageTitle.textContent = 'Editar clase';
      saveButton.textContent = 'Guardar cambios';
      deleteButton.classList.remove('d-none');

      const { data } = await MentoriasApi.getClase(classId);
      if (Number(data.mentorId) !== Number(user.id)) {
        window.location.href = '/pages/clases.html';
        return;
      }

      currentClase = data;
      document.getElementById('titulo').value = data.titulo || '';
      document.getElementById('descripcion').value = data.descripcion || '';
      document.getElementById('modalidad').value = data.modalidad || 'virtual';
      if (data.fecha) {
        const date = new Date(data.fecha);
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
        document.getElementById('fecha').value = localDate;
      }
    }

    renderMaterias(materiasMentor, currentClase?.materiaId);
  } catch (error) {
    showMessage('danger', error.message);
    toggleFormAvailability(false);
    return;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const fechaValue = document.getElementById('fecha').value;
    if (!fechaValue) {
      showMessage('danger', 'Debes indicar una fecha valida.');
      return;
    }

    const payload = {
      titulo: document.getElementById('titulo').value,
      descripcion: document.getElementById('descripcion').value,
      fecha: new Date(fechaValue).toISOString().slice(0, 19).replace('T', ' '),
      modalidad: document.getElementById('modalidad').value,
      materiaId: Number(materiaSelect.value),
      mentorId: user.id,
    };

    try {
      saveButton.disabled = true;
      showMessage('info', isEdit ? 'Guardando cambios...' : 'Creando clase...');

      if (isEdit) {
        await MentoriasApi.updateClase(classId, payload);
      } else {
        await MentoriasApi.createClase(payload);
      }

      showMessage('success', isEdit ? 'Clase actualizada.' : 'Clase creada.');
      setTimeout(() => {
        window.location.href = '/pages/clases.html';
      }, 600);
    } catch (error) {
      showMessage('danger', error.message);
    } finally {
      saveButton.disabled = false;
    }
  });

  if (deleteButton) {
    deleteButton.addEventListener('click', async function () {
      if (!isEdit) return;
      if (!window.confirm('Seguro que quieres eliminar esta clase?')) return;

      try {
        deleteButton.disabled = true;
        showMessage('warning', 'Eliminando clase...');
        await MentoriasApi.deleteClase(classId, { mentorId: user.id });
        showMessage('success', 'Clase eliminada.');
        setTimeout(() => {
          window.location.href = '/pages/clases.html';
        }, 600);
      } catch (error) {
        showMessage('danger', error.message);
        deleteButton.disabled = false;
      }
    });
  }
})();
