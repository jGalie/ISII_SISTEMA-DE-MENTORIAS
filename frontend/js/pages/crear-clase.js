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

  function showMessage(type, text) {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove('d-none');
  }

  if (isEdit) {
    pageTitle.textContent = 'Editar clase';
    saveButton.textContent = 'Guardar cambios';
    deleteButton.classList.remove('d-none');

    try {
      const { data } = await MentoriasApi.getClase(classId);
      if (Number(data.mentorId) !== Number(user.id)) {
        window.location.href = '/pages/clases.html';
        return;
      }

      document.getElementById('titulo').value = data.titulo || '';
      document.getElementById('descripcion').value = data.descripcion || '';
      document.getElementById('modalidad').value = data.modalidad || 'virtual';
      if (data.fecha) {
        const date = new Date(data.fecha);
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
        document.getElementById('fecha').value = localDate;
      }
    } catch (error) {
      showMessage('danger', error.message);
    }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const payload = {
      titulo: document.getElementById('titulo').value,
      descripcion: document.getElementById('descripcion').value,
      fecha: new Date(document.getElementById('fecha').value).toISOString().slice(0, 19).replace('T', ' '),
      modalidad: document.getElementById('modalidad').value,
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
      if (!window.confirm('¿Seguro que quieres eliminar esta clase?')) return;

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
