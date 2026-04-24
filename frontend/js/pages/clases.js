(async function () {
  /**
   * Listado general de clases.
   *
   * Esta pantalla integra la informacion recuperada desde la API con acciones
   * propias del rol autenticado. Desde la interfaz se decide que botones mostrar,
   * mientras que las autorizaciones definitivas quedan en el backend.
   */
  if (!MentoriasAuth.requireAuth()) return;
  await MentoriasUI.mountNavbar();

  const box = document.getElementById('clases-list');
  const err = document.getElementById('clases-error');
  const q = document.getElementById('q');
  const count = document.getElementById('clases-count');
  const createButton = document.getElementById('btn-crear-clase');
  const user = MentoriasAuth.getUser();

  let clases = [];
  let inscripcionesPorClase = {};

  if (user && user.rol === 'mentor') {
    createButton.classList.remove('d-none');
  }

  function showError(message) {
    err.textContent = message;
    err.classList.remove('alert-success');
    err.classList.add('alert-danger');
    err.classList.remove('d-none');
  }

  function showSuccess(message) {
    err.textContent = message;
    err.classList.remove('alert-danger');
    err.classList.add('alert-success');
    err.classList.remove('d-none');
  }

  function hideError() {
    err.classList.add('d-none');
    err.classList.remove('alert-success');
    err.classList.add('alert-danger');
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function attachDeleteHandlers() {
    // Los mentores pueden solicitar la eliminacion desde el listado, pero el
    // backend vuelve a validar que sean propietarios de la clase.
    box.querySelectorAll('.delete-clase-btn').forEach((button) => {
      button.addEventListener('click', async function () {
        const classId = this.getAttribute('data-id');
        if (!classId || !user) return;
        if (!window.confirm('¿Seguro que quieres eliminar esta clase?')) return;

        try {
          this.disabled = true;
          await MentoriasApi.eliminarClase(classId, { mentorId: user.id });
          clases = clases.filter((item) => String(item.id) !== String(classId));
          applyFilter();
        } catch (error) {
          showError(error.message);
          this.disabled = false;
        }
      });
    });
  }

  function attachEnrollmentHandlers() {
    // La inscripcion se ejecuta desde la UI y luego se vuelve a consultar el
    // estado para reflejar la respuesta real del sistema.
    box.querySelectorAll('.enroll-clase-btn').forEach((button) => {
      button.addEventListener('click', async function () {
        const classId = Number(this.getAttribute('data-id'));
        if (!classId || !user || user.rol !== 'estudiante') return;

        try {
          this.disabled = true;
          await MentoriasApi.createInscripcion({
            id_usuario: user.id,
            id_clase: classId,
          });
          const response = await MentoriasApi.getInscripcionesUsuario(user.id);
          const items = Array.isArray(response.data) ? response.data : [];
          inscripcionesPorClase = Object.fromEntries(items.map((item) => [item.claseId, item]));
          showSuccess('Tu solicitud fue enviada al mentor.');
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
      showStudentEnrollment: true,
      currentUser: user,
      enrollmentByClassId: inscripcionesPorClase,
    });
    attachDeleteHandlers();
    attachEnrollmentHandlers();
    count.textContent = `${list.length} clase(s)`;
  }

  function applyFilter() {
    const term = normalize(q.value);
    if (!term) {
      render(clases);
      return;
    }

    const filtered = clases.filter((clase) => {
      const searchable = [clase.titulo, clase.descripcion, clase.mentorNombre, clase.materiaNombre].map(normalize).join(' ');
      return searchable.includes(term);
    });
    render(filtered);
  }

  try {
    // Se cargan en paralelo las clases y, cuando corresponde, las inscripciones
    // del estudiante para mostrar estados coherentes desde el primer render.
    const [response, inscripcionesResponse] = await Promise.all([
      user && user.rol === 'mentor'
        ? MentoriasApi.obtenerClases({ id_mentor: user.id })
        : MentoriasApi.obtenerClases(),
      user && user.rol === 'estudiante'
        ? MentoriasApi.getInscripcionesUsuario(user.id)
        : Promise.resolve({ data: [] }),
    ]);

    clases = Array.isArray(response.data) ? response.data : [];
    const inscripciones = Array.isArray(inscripcionesResponse.data) ? inscripcionesResponse.data : [];
    inscripcionesPorClase = Object.fromEntries(inscripciones.map((item) => [item.claseId, item]));
    hideError();
    render(clases);
  } catch (error) {
    showError(error.message);
    render([]);
  }

  q.addEventListener('input', applyFilter);
})();
