(async function () {
  /**
   * El dashboard representa la operacion principal del sistema luego del login.
   * Segun el rol, muestra seguimiento de solicitudes o herramientas de gestion
   * para que el mentor pueda responder inscripciones.
   */
  if (!MentoriasAuth.requireAuth()) return;

  if (window.MentoriasUI && typeof MentoriasUI.mountNavbar === 'function') {
    await MentoriasUI.mountNavbar();
  }

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
  const mentorHistoryList = document.getElementById('mentor-history-list');
  const mentorClassesList = document.getElementById('mentor-classes-list');

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
    logoutButton.addEventListener('click', async function () {
      const confirmarSalida = await MentoriasUI.showConfirmDialog({
        title: 'Cerrar sesion',
        message: 'Queres cerrar tu sesion en Mentorix?',
        confirmText: 'Cerrar sesion',
        cancelText: 'Cancelar',
      });
      if (!confirmarSalida) return;
      MentoriasAuth.logout();
      window.location.href = '/pages/login.html';
    });
  }

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.classList.remove('d-none');
  }

  function clearError() {
    if (!errorBox) return;
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
    // Resume el estado de una solicitud desde la perspectiva estudiantil.
    const statusMessages = {
      pendiente: 'Tu solicitud esta siendo evaluada por el mentor',
      rechazada: item.motivoRechazo || 'El mentor no aprobo tu solicitud',
    };
    const acceptedAction =
      item.estado === 'aceptada'
        ? `<a class="btn btn-outline-dark btn-sm rounded-pill px-3 mt-3" href="/pages/detalle-clase.html?id=${encodeURIComponent(item.claseId)}">Ver clase</a>`
        : '';
    const helperText = statusMessages[item.estado]
      ? `<p class="text-muted small mb-0 mt-2">${escapeHtml(statusMessages[item.estado])}</p>`
      : '';

    return `
      <article class="item-card p-3">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-2">
          <div>
            <h3 class="h6 fw-bold mb-1">${escapeHtml(item.claseTitulo || 'Clase')}</h3>
            <p class="text-muted mb-1">${escapeHtml(item.mentorNombre || 'Mentorix')}</p>
          </div>
          <span class="status-badge ${statusClass(item.estado)}">${escapeHtml(item.estado)}</span>
        </div>
        ${helperText}
        <p class="text-muted small mb-1">
          <i class="bi bi-calendar-event me-1"></i>${escapeHtml(formatDate(item.claseFecha))}
        </p>
        <p class="text-muted small mb-0">
          <i class="bi bi-clock-history me-1"></i>Solicitada: ${escapeHtml(formatDate(item.fechaSolicitud))}
        </p>
        ${acceptedAction}
      </article>
    `;
  }

  function buildMentorPendingCard(item) {
    // Combina informacion de contexto con acciones de decision para el mentor.
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
          <button class="btn btn-success" data-action="aceptada" data-id="${item.id}" type="button">
            Aceptar
          </button>
          <button class="btn btn-outline-danger" data-action="rechazada" data-id="${item.id}" type="button">
            Rechazar
          </button>
        </div>
      </article>
    `;
  }

  function buildMentorHistoryCard(item) {
    const nextStatus = item.estado === 'aceptada' ? 'rechazada' : 'aceptada';
    const actionLabel = item.estado === 'aceptada' ? 'Cambiar a rechazada' : 'Cambiar a aceptada';
    const actionClass = item.estado === 'aceptada' ? 'btn-outline-danger' : 'btn-success';

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
          <button class="btn ${actionClass}" data-action="${nextStatus}" data-id="${item.id}" type="button">
            ${actionLabel}
          </button>
        </div>
      </article>
    `;
  }

  function buildMentorClassCard(clase) {
    const fecha = new Date(clase.fecha);

    const fechaTexto = Number.isNaN(fecha.getTime())
      ? 'Fecha pendiente'
      : fecha.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

    const horaTexto = Number.isNaN(fecha.getTime())
      ? 'Horario pendiente'
      : fecha.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
        });

    return `
      <div class="col-12 col-md-6">
        <article class="item-card p-4 h-100">
          <div class="d-flex justify-content-between align-items-start gap-3 mb-2 flex-wrap">
            <h3 class="h6 fw-bold mb-0">${escapeHtml(clase.titulo || 'Clase')}</h3>
            <span class="status-badge status-pendiente">${escapeHtml(fechaTexto)}</span>
          </div>
          <p class="text-muted small mb-2">
            <i class="bi bi-clock me-1"></i>${escapeHtml(horaTexto)}
          </p>
          <p class="text-muted small mb-0">${escapeHtml(clase.descripcion || 'Sin descripción.')}</p>
        </article>
      </div>
    `;
  }

  function renderEmpty(container, message) {
    if (!container) return;
    container.innerHTML = `
      <div class="item-card p-3 text-muted text-center">
        ${escapeHtml(message)}
      </div>
    `;
  }

  function renderEmptyWithAction(container, message, actionLabel, href) {
    if (!container) return;
    container.innerHTML = `
      <div class="item-card p-3 text-muted text-center">
        <p class="mb-3">${escapeHtml(message)}</p>
        <a class="btn btn-outline-dark btn-sm rounded-pill px-3" href="${href}">${escapeHtml(actionLabel)}</a>
      </div>
    `;
  }

  function renderEmptyGrid(container, message) {
    if (!container) return;
    container.innerHTML = `
      <div class="col-12">
        <div class="item-card p-3 text-muted text-center">
          ${escapeHtml(message)}
        </div>
      </div>
    `;
  }

  function renderEmptyGridWithAction(container, message, actionLabel, href) {
    if (!container) return;
    container.innerHTML = `
      <div class="col-12">
        <div class="item-card p-3 text-muted text-center">
          <p class="mb-3">${escapeHtml(message)}</p>
          <a class="btn btn-outline-dark btn-sm rounded-pill px-3" href="${href}">${escapeHtml(actionLabel)}</a>
        </div>
      </div>
    `;
  }

  function updateMetrics(items) {
    // Ofrece una lectura sintetica del panel mediante contadores por estado.
    const counts = items.reduce(
      (acc, item) => {
        acc[item.estado] = (acc[item.estado] || 0) + 1;
        return acc;
      },
      { pendiente: 0, aceptada: 0, rechazada: 0 }
    );

    if (metricPendiente) metricPendiente.textContent = counts.pendiente || 0;
    if (metricAceptada) metricAceptada.textContent = counts.aceptada || 0;
    if (metricRechazada) metricRechazada.textContent = counts.rechazada || 0;
  }

  async function loadStudentDashboard() {
    // Se separan las inscripciones por estado para ordenar mejor el seguimiento.
    if (studentDashboard) studentDashboard.classList.remove('d-none');

    const response = await MentoriasApi.getInscripcionesUsuario(user.id);
    const items = Array.isArray(response.data) ? response.data : [];
    updateMetrics(items);

    const pending = items.filter((item) => item.estado === 'pendiente');
    const accepted = items.filter((item) => item.estado === 'aceptada');
    const rejected = items.filter((item) => item.estado === 'rechazada');

    if (pendingList) pendingList.innerHTML = pending.length ? pending.map(buildStudentCard).join('') : '';
    if (acceptedList) acceptedList.innerHTML = accepted.length ? accepted.map(buildStudentCard).join('') : '';
    if (rejectedList) rejectedList.innerHTML = rejected.length ? rejected.map(buildStudentCard).join('') : '';

    if (!pending.length) renderEmptyWithAction(pendingList, 'No tenes inscripciones pendientes.', 'Explorar clases', '/pages/clases.html');
    if (!accepted.length) renderEmptyWithAction(acceptedList, 'Todavia no tenes clases aceptadas.', 'Explorar clases', '/pages/clases.html');
    if (!rejected.length) renderEmpty(rejectedList, 'No hay solicitudes rechazadas.');
  }

  function attachMentorActions(container) {
    // Despues de una accion, se recarga la informacion para mantener sincronizada la vista.
    if (!container) return;

    container.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', async function () {
        const id = Number(this.getAttribute('data-id'));
        const estado = this.getAttribute('data-action');
        if (!id || !estado) return;
        const esAceptacion = estado === 'aceptada';
        const confirmarCambio = await MentoriasUI.showConfirmDialog({
          title: esAceptacion ? 'Aceptar solicitud' : 'Rechazar solicitud',
          message: esAceptacion
            ? 'La solicitud pasara a estar aceptada para el estudiante.'
            : 'La solicitud pasara a estar rechazada para el estudiante.',
          confirmText: esAceptacion ? 'Aceptar' : 'Rechazar',
          cancelText: 'Cancelar',
          tone: esAceptacion ? 'success' : 'danger',
        });
        if (!confirmarCambio) return;

        this.disabled = true;
        clearError();

        try {
          await MentoriasApi.updateEstadoInscripcion(id, { estado, mentorId: user.id });
          await loadMentorDashboard();
        } catch (error) {
          this.disabled = false;
          showError(error.message || 'No se pudo actualizar la inscripción.');
        }
      });
    });
  }

  async function loadMentorClasses() {
    if (!mentorClassesList) return;

    try {
      const response = await fetch('/clases');
      const json = await response.json();
      const clases = Array.isArray(json.data) ? json.data : [];

      const clasesMentor = clases.filter(
        (clase) =>
          Number(clase.id_mentor ?? clase.idMentor ?? clase.mentorId) === Number(user.id)
      );

      if (!clasesMentor.length) {
        renderEmptyGridWithAction(mentorClassesList, 'Todavia no publicaste clases.', 'Crear clase', '/pages/crear-clase.html');
        return;
      }

      mentorClassesList.innerHTML = clasesMentor.map(buildMentorClassCard).join('');
    } catch (error) {
      console.error('Error cargando clases del mentor:', error);
      renderEmptyGrid(mentorClassesList, 'No pudimos cargar tu agenda de clases.');
    }
  }

  async function loadMentorDashboard() {
    // Este flujo construye el espacio de trabajo del mentor.
    if (mentorDashboard) mentorDashboard.classList.remove('d-none');

    const response = await MentoriasApi.getInscripcionesMentor(user.id);
    const items = Array.isArray(response.data) ? response.data : [];
    updateMetrics(items);

    const pendingItems = items.filter((item) => item.estado === 'pendiente');
    const managedItems = items.filter((item) => item.estado === 'aceptada' || item.estado === 'rechazada');

    if (!pendingItems.length) {
      renderEmpty(mentorList, 'No tienes solicitudes pendientes.');
    } else {
      if (mentorList) mentorList.innerHTML = pendingItems.map(buildMentorPendingCard).join('');
      attachMentorActions(mentorList);
    }

    if (!managedItems.length) {
      renderEmpty(mentorHistoryList, 'Todavia no hay solicitudes gestionadas.');
    } else {
      if (mentorHistoryList) mentorHistoryList.innerHTML = managedItems.map(buildMentorHistoryCard).join('');
      attachMentorActions(mentorHistoryList);
    }

    await loadMentorClasses();
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
