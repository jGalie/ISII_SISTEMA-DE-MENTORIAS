(async function () {
  await MentoriasUI.mountNavbar();

  const box = document.getElementById('clases-list');
  const err = document.getElementById('clases-error');
  const q = document.getElementById('q');
  const count = document.getElementById('clases-count');
  const createButton = document.getElementById('btn-crear-clase');
  const user = MentoriasAuth.getUser();

  let clases = [];

  if (user && user.rol === 'mentor') {
    createButton.classList.remove('d-none');
  }

  function showError(message) {
    err.textContent = message;
    err.classList.remove('d-none');
  }

  function hideError() {
    err.classList.add('d-none');
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function attachDeleteHandlers() {
    box.querySelectorAll('.delete-clase-btn').forEach((button) => {
      button.addEventListener('click', async function () {
        const classId = this.getAttribute('data-id');
        if (!classId || !user) return;
        if (!window.confirm('¿Seguro que quieres eliminar esta clase?')) return;

        try {
          this.disabled = true;
          await MentoriasApi.deleteClase(classId, { mentorId: user.id });
          clases = clases.filter((item) => String(item.id) !== String(classId));
          applyFilter();
        } catch (error) {
          showError(error.message);
          this.disabled = false;
        }
      });
    });
  }

  function render(list) {
    MentoriasUI.renderClasesCards(box, list, {
      showMentorActions: true,
      currentUser: user,
    });
    attachDeleteHandlers();
    count.textContent = `${list.length} clase(s)`;
  }

  function applyFilter() {
    const term = normalize(q.value);
    if (!term) {
      render(clases);
      return;
    }

    const filtered = clases.filter((clase) => {
      const searchable = [clase.titulo, clase.descripcion, clase.mentorNombre].map(normalize).join(' ');
      return searchable.includes(term);
    });
    render(filtered);
  }

  try {
    const response =
      user && user.rol === 'mentor'
        ? await MentoriasApi.getClases({ id_mentor: user.id })
        : await MentoriasApi.getClases();

    clases = Array.isArray(response.data) ? response.data : [];
    hideError();
    render(clases);
  } catch (error) {
    showError(error.message);
    render([]);
  }

  q.addEventListener('input', applyFilter);
})();
