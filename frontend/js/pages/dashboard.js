(async function () {
  if (!MentoriasAuth.requireAuth()) return;

  const user = MentoriasAuth.getUser();
  const welcome = document.getElementById('welcome-text');
  const errorBox = document.getElementById('dashboard-error');
  const logoutButton = document.getElementById('logout-button');
  const studentDashboard = document.getElementById('student-dashboard');
  const mentorDashboard = document.getElementById('mentor-dashboard');
  const pendingList = document.getElementById('pending-list');
  const acceptedList = document.getElementById('accepted-list');
  const rejectedList = document.getElementById('rejected-list');
  const mentorList = document.getElementById('mentor-list');

  const metricPendiente = document.getElementById('metric-pendiente');
  const metricAceptada = document.getElementById('metric-aceptada');
  const metricRechazada = document.getElementById('metric-rechazada');

  if (welcome && user) {
    welcome.textContent =
      user.rol === 'mentor'
        ? `Hola, ${user.nombre}. Gestioná las solicitudes de tus clases desde un solo lugar.`
        : `Hola, ${user.nombre}. Seguís el estado de tus inscripciones en tiempo real.`;
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', function () {
      MentoriasAuth.logout();
      window.location.href = '/pages/login.html';
    });
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('d-none');
  }

  function clearError() {
    errorBox.classList.add('d-none');
    errorBox.textContent = '';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Fecha pendiente';
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function statusClass(estado) {
    return {
      pendiente: 'status-pendiente',
      aceptada: 'status-aceptada',
      rechazada: 'status-rechazada',
    }[estado] || 'status-pendiente';
  }

  function buildStudentCard(item) {
    return `
      <article class="item-card p-3">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-2">
          <div>
            <h3 class="h6 fw-bold mb-1">${escapeHtml(item.claseTitulo || 'Clase')}</h3>
            <p class="text-muted mb-1">${escapeHtml(item.mentorNombre || 'Mentorix')}</p>
          </div>
          <span class="status-badge ${statusClass(item.estado)}">${escapeHtml(item.estado)}</span>
        </div>
        <p class="text-muted small mb-1"><i class="bi bi-calendar-event me-1"></i>${escapeHtml(formatDate(item.claseFecha))}</p>
        <p class="text-muted small mb-0"><i class="bi bi-clock-history me-1"></i>Solicitada: ${escapeHtml(formatDate(item.fechaSolicitud))}</p>
      </article>
    `;
  }

  function buildMentorCard(item) {
    const pending = item.estado === 'pendiente';
    return `
      <article class="item-card p-3">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-2 flex-wrap">
          <div>
            <h3 class="h6 fw-bold mb-1">${escapeHtml(item.claseTitulo || 'Clase')}</h3>
            <p class="text-muted mb-1">${escapeHtml(item.usuarioNombre || item.usuarioEmail || 'Estudiante')}</p>
            <p class="text-muted small mb-0">${escapeHtml(formatDate(item.fechaSolicitud))}</p>
          </div>
          <span class="status-badge ${statusClass(item.estado)}">${escapeHtml(item.estado)}</span>
        </div>
        <p class="text-muted small mb-3">${escapeHtml(item.claseDescripcion || '')}</p>
        <div class="mentor-actions d-flex gap-2 flex-wrap">
          <button class="btn btn-success ${pending ? '' : 'disabled'}" data-action="aceptada" data-id="${item.id}" type="button">Aceptar</button>
          <button class="btn btn-outline-danger ${pending ? '' : 'disabled'}" data-action="rechazada" data-id="${item.id}" type="button">Rechazar</button>
        </div>
      </article>
    `;
  }

  function renderEmpty(container, message) {
    container.innerHTML = `
      <div class="item-card p-3 text-muted text-center">
        ${escapeHtml(message)}
      </div>
    `;
  }

  function updateMetrics(items) {
    const counts = items.reduce(
      (acc, item) => {
        acc[item.estado] = (acc[item.estado] || 0) + 1;
        return acc;
      },
      { pendiente: 0, aceptada: 0, rechazada: 0 }
    );

    metricPendiente.textContent = counts.pendiente || 0;
    metricAceptada.textContent = counts.aceptada || 0;
    metricRechazada.textContent = counts.rechazada || 0;
  }

  async function loadStudentDashboard() {
    studentDashboard.classList.remove('d-none');
    const response = await MentoriasApi.getInscripcionesUsuario(user.id);
    const items = Array.isArray(response.data) ? response.data : [];
    updateMetrics(items);

    const pending = items.filter((item) => item.estado === 'pendiente');
    const accepted = items.filter((item) => item.estado === 'aceptada');
    const rejected = items.filter((item) => item.estado === 'rechazada');

    pendingList.innerHTML = pending.length ? pending.map(buildStudentCard).join('') : '';
    acceptedList.innerHTML = accepted.length ? accepted.map(buildStudentCard).join('') : '';
    rejectedList.innerHTML = rejected.length ? rejected.map(buildStudentCard).join('') : '';

    if (!pending.length) renderEmpty(pendingList, 'No tienes solicitudes pendientes.');
    if (!accepted.length) renderEmpty(acceptedList, 'Todavía no tienes clases aceptadas.');
    if (!rejected.length) renderEmpty(rejectedList, 'No hay solicitudes rechazadas.');
  }

  function attachMentorActions() {
    mentorList.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', async function () {
        const id = Number(this.getAttribute('data-id'));
        const estado = this.getAttribute('data-action');
        if (!id || !estado) return;

        this.disabled = true;
        clearError();
        try {
          await MentoriasApi.updateEstadoInscripcion(id, { estado, mentorId: user.id });
          await loadMentorDashboard();
        } catch (error) {
          this.disabled = false;
          showError(error.message);
        }
      });
    });
  }

  async function loadMentorDashboard() {
    mentorDashboard.classList.remove('d-none');
    const response = await MentoriasApi.getInscripcionesMentor(user.id);
    const items = Array.isArray(response.data) ? response.data : [];
    updateMetrics(items);

    if (!items.length) {
      renderEmpty(mentorList, 'Aún no tienes solicitudes de inscripción.');
      return;
    }

    mentorList.innerHTML = items.map(buildMentorCard).join('');
    attachMentorActions();
  }

  try {
    clearError();
    if (user.rol === 'mentor') {
      await loadMentorDashboard();
    } else {
      await loadStudentDashboard();
    }
  } catch (error) {
    showError(error.message || 'No pudimos cargar tu dashboard.');
  }
})();
