(async function () {
  if (!MentoriasAuth.requerirAutenticacion()) return;

  if (window.MentoriasUI && typeof MentoriasUI.montarNavbar === 'function') {
    await MentoriasUI.montarNavbar();
  }

  const user = MentoriasAuth.obtenerUsuario();
  const welcome = document.getElementById('welcome-text');
  const errorBox = document.getElementById('dashboard-error');
  const studentDashboard = document.getElementById('student-dashboard');
  const studentSummaryCards = document.getElementById('student-summary-cards');
  const studentSummaryPanel = document.getElementById('student-summary-panel');
  const studentFollowupPanel = document.getElementById('student-followup-panel');
  const studentMessagesPanel = document.getElementById('student-messages-panel');
  const mentorDashboard = document.getElementById('mentor-dashboard');
  const pendingList = document.getElementById('pending-list');
  const acceptedList = document.getElementById('accepted-list');
  const rejectedList = document.getElementById('rejected-list');
  const mentorSummaryCards = document.getElementById('mentor-summary-cards');
  const mentorSummaryPanel = document.getElementById('mentor-summary-panel');
  const mentorPendingList = document.getElementById('mentor-pending-list');
  const mentorAcceptedList = document.getElementById('mentor-accepted-list');
  const mentorRejectedList = document.getElementById('mentor-rejected-list');
  const mentorClassesList = document.getElementById('mentor-classes-list');
  const mentorFollowupPanel = document.getElementById('mentor-followup-panel');
  const mentorMessagesPanel = document.getElementById('mentor-messages-panel');
  const mentorMaterialsPanel = document.getElementById('mentor-materials-panel');
  const mensajesModalElement = document.getElementById('mensajes-modal');
  const mensajesModalTitle = document.getElementById('mensajes-modal-title');
  const mensajesModalSubtitle = document.getElementById('mensajes-modal-subtitle');
  const mensajesInfo = document.getElementById('mensajes-inscripcion-info');
  const mensajesList = document.getElementById('mensajes-list');
  const mensajesAlert = document.getElementById('mensajes-alert');
  const mensajesForm = document.getElementById('mensajes-form');
  const mensajesContenido = document.getElementById('mensajes-contenido');
  const mensajesEnviar = document.getElementById('mensajes-enviar');
  const metricPendiente = document.getElementById('metric-pendiente');
  const metricAceptada = document.getElementById('metric-aceptada');
  const metricRechazada = document.getElementById('metric-rechazada');
  const metricsRow = document.getElementById('metrics-row');

  const inscripcionesPorId = new Map();
  let inscripcionActiva = null;
  let studentInscripciones = [];
  let studentTabActiva = 'resumen';
  let studentMensajeActivo = null;
  let mentorInscripciones = [];
  let mentorClases = [];
  let mentorMateriales = [];
  let mentorTabActiva = 'resumen';

  if (welcome && user) {
    welcome.textContent =
      user.rol === 'mentor'
        ? `Hola, ${user.nombre}. Gestiona tus solicitudes, clases y seguimientos desde un solo lugar.`
        : `Hola, ${user.nombre}. Seguis el estado de tus inscripciones en tiempo real.`;
  }

  function escaparHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatearFecha(value) {
    if (!value) return 'Fecha pendiente';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Fecha pendiente';
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function mostrarError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.classList.remove('d-none');
  }

  function limpiarError() {
    if (!errorBox) return;
    errorBox.classList.add('d-none');
    errorBox.textContent = '';
  }

  function obtener_id_inscripcion(item) {
    return Number(item?.id_inscripcion || item?.id || 0);
  }

  function obtener_id_clase(item) {
    return Number(item?.id_clase || item?.id || 0);
  }

  function claseEstado(estado) {
    return {
      pendiente: 'status-pendiente',
      aceptada: 'status-aceptada',
      rechazada: 'status-rechazada',
    }[estado] || 'status-pendiente';
  }

  function obtenerNombreContraparte(item) {
    if (!item) return 'Mentorix';
    if (user.rol === 'mentor') return item.usuarioNombre || item.usuarioEmail || 'Estudiante';
    return item.mentorNombre || item.mentorEmail || 'Mentor';
  }

  function obtenerInscripcionesAceptadas() {
    return mentorInscripciones.filter((item) => item.estado === 'aceptada');
  }

  function numeroSeguro(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function contarPorEstado(items, estado) {
    return (Array.isArray(items) ? items : []).filter((item) => item?.estado === estado).length || 0;
  }

  function calcularMetricasEstudiante(inscripciones) {
    const items = Array.isArray(inscripciones) ? inscripciones : [];
    const aceptadas = contarPorEstado(items, 'aceptada');
    return {
      realizadas: numeroSeguro(items.length),
      pendientes: contarPorEstado(items, 'pendiente'),
      aceptadas,
      rechazadas: contarPorEstado(items, 'rechazada'),
      seguimientos: aceptadas,
      mensajes: aceptadas,
    };
  }

  function calcularMetricasInscripciones(items) {
    return {
      pendientes: contarPorEstado(items, 'pendiente'),
      aceptadas: contarPorEstado(items, 'aceptada'),
      rechazadas: contarPorEstado(items, 'rechazada'),
    };
  }

  function actualizarMetricas(items) {
    const { pendientes, aceptadas, rechazadas } = calcularMetricasInscripciones(items);
    if (metricPendiente) metricPendiente.textContent = String(pendientes);
    if (metricAceptada) metricAceptada.textContent = String(aceptadas);
    if (metricRechazada) metricRechazada.textContent = String(rechazadas);
  }

  function renderizarVacio(container, texto) {
    if (!container) return;
    container.innerHTML = `<div class="item-card p-3 text-muted text-center">${escaparHtml(texto)}</div>`;
  }

  function renderizarVacioConAccion(container, texto, label, href) {
    if (!container) return;
    container.innerHTML = `
      <div class="item-card p-3 text-muted text-center">
        <p class="mb-3">${escaparHtml(texto)}</p>
        <a class="btn btn-outline-dark btn-sm rounded-pill px-3" href="${escaparHtml(href)}">${escaparHtml(label)}</a>
      </div>
    `;
  }

  function mostrarTabEstudiante(nombre_tab) {
    studentTabActiva = nombre_tab || 'resumen';
    document.querySelectorAll('[data-student-tab]').forEach((button) => {
      const activa = button.getAttribute('data-student-tab') === studentTabActiva;
      button.classList.toggle('active', activa);
      button.setAttribute('aria-selected', activa ? 'true' : 'false');
    });
    document.querySelectorAll('.student-tab-panel').forEach((panel) => {
      panel.classList.toggle('d-none', panel.id !== `student-tab-${studentTabActiva}`);
    });
  }

  function inicializarTabsEstudiante() {
    document.querySelectorAll('[data-student-tab]').forEach((button) => {
      button.addEventListener('click', () => mostrarTabEstudiante(button.getAttribute('data-student-tab')));
    });
  }

  function adjuntarAccesosRapidosEstudiante(container) {
    if (!container) return;
    container.querySelectorAll('[data-student-quick-tab]').forEach((button) => {
      button.addEventListener('click', () => mostrarTabEstudiante(button.getAttribute('data-student-quick-tab')));
    });
  }

  function activarTabMentor(tab) {
    mentorTabActiva = tab || 'resumen';
    document.querySelectorAll('[data-mentor-tab]').forEach((button) => {
      const activa = button.getAttribute('data-mentor-tab') === mentorTabActiva;
      button.classList.toggle('is-active', activa);
      button.setAttribute('aria-selected', activa ? 'true' : 'false');
    });
    document.querySelectorAll('.mentor-tab-panel').forEach((panel) => {
      panel.classList.toggle('d-none', panel.id !== `mentor-tab-${mentorTabActiva}`);
    });
  }

  function vincularTabsMentor() {
    document.querySelectorAll('[data-mentor-tab]').forEach((button) => {
      button.addEventListener('click', () => activarTabMentor(button.getAttribute('data-mentor-tab')));
    });
  }

  function construirBotonMensajes(item) {
    return `
      <button class="btn btn-outline-dark btn-sm rounded-pill px-3" data-message-id="${escaparHtml(obtener_id_inscripcion(item))}" type="button">
        <i class="bi bi-chat-left-text me-1"></i>Mensajes
      </button>
    `;
  }

  function construirBotonTabMentor(tab, label, id_inscripcion) {
    return `
      <button class="btn btn-outline-dark btn-sm rounded-pill px-3" data-switch-tab="${escaparHtml(tab)}" data-inscripcion-target="${escaparHtml(id_inscripcion || '')}" type="button">
        ${escaparHtml(label)}
      </button>
    `;
  }

  function construirPanelSeguimiento(item, permitirRegistro) {
    const id_inscripcion = obtener_id_inscripcion(item);
    if (item.estado !== 'aceptada') {
      return `
        <section class="seguimiento-panel mt-3">
          <h4 class="h6 fw-bold mb-2">Seguimiento academico</h4>
          <p class="text-muted small mb-0">El seguimiento academico esta disponible unicamente para inscripciones aceptadas.</p>
        </section>
      `;
    }

    const formularioMentor = permitirRegistro
      ? `
        <form class="seguimiento-form d-grid gap-2 mt-3" data-seguimiento-form="${escaparHtml(id_inscripcion)}">
          <label class="form-label fw-semibold mb-0" for="seguimiento-notas-${escaparHtml(id_inscripcion)}">Observacion del mentor</label>
          <textarea id="seguimiento-notas-${escaparHtml(id_inscripcion)}" class="form-control" name="notas" rows="3" required placeholder="Observaciones del mentor"></textarea>
          <div class="d-flex justify-content-end">
            <button class="btn btn-dark rounded-pill px-4" type="submit">
              <i class="bi bi-save me-1"></i>Guardar seguimiento
            </button>
          </div>
          <div class="seguimiento-feedback text-danger small d-none" role="alert"></div>
        </form>
      `
      : '<p class="text-muted small mb-0 mt-3">Este seguimiento es solo de lectura. Ante cualquier duda, podes comunicarte con tu mentor.</p>';

    return `
      <section class="seguimiento-panel mt-3" data-seguimiento-id="${escaparHtml(id_inscripcion)}">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-2 flex-wrap">
          <h4 class="h6 fw-bold mb-0">Seguimiento academico</h4>
          <span class="status-badge status-aceptada">En curso</span>
        </div>
        <div class="seguimiento-content text-muted small">Cargando seguimiento...</div>
        ${formularioMentor}
      </section>
    `;
  }

  function construirResumenSeguimiento(registros) {
    const historial = Array.isArray(registros) ? registros : [];
    const ultimo = historial.length ? historial[historial.length - 1] : null;
    const notas = ultimo?.notas || ultimo?.observacion || 'Todavia no hay observaciones del mentor.';
    const fecha = ultimo ? formatearFecha(ultimo.fecha_seguimiento) : 'Sin actualizaciones';
    const historialHtml = historial.length
      ? historial
          .map(
            (registro) => `
              <li>
                <span class="fw-semibold">${escaparHtml(formatearFecha(registro.fecha_seguimiento))}</span>
                <span class="text-muted">- ${escaparHtml(registro.notas || registro.observacion || 'Sin observacion')}</span>
              </li>
            `
          )
          .join('')
      : '<li class="text-muted">No hay registros de seguimiento todavia.</li>';

    return `
      <div class="d-grid gap-1">
        <div><span class="fw-semibold">Estado:</span> En curso</div>
        <div><span class="fw-semibold">Ultima actualizacion:</span> ${escaparHtml(fecha)}</div>
        <div><span class="fw-semibold">Ultima observacion:</span> ${escaparHtml(notas)}</div>
      </div>
      <div class="mt-2">
        <div class="fw-semibold mb-1">Historial de observaciones</div>
        <ul class="seguimiento-historial mb-0">${historialHtml}</ul>
      </div>
    `;
  }

  async function cargarSeguimiento(id_inscripcion) {
    const id_inscripcion_normalizado = Number(id_inscripcion);
    if (!id_inscripcion_normalizado) return;
    const panel = document.querySelector(`[data-seguimiento-id="${id_inscripcion_normalizado}"]`);
    if (!panel) return;
    const content = panel.querySelector('.seguimiento-content');
    if (!content) return;

    try {
      const response = await MentoriasApi.listarSeguimientosPorInscripcion(id_inscripcion_normalizado);
      content.innerHTML = construirResumenSeguimiento(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      content.innerHTML = `<div class="text-danger">${escaparHtml(error.message || 'No se pudo cargar el seguimiento.')}</div>`;
    }
  }

  function adjuntarFormulariosSeguimiento(container) {
    if (!container) return;
    container.querySelectorAll('[data-seguimiento-form]').forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id_inscripcion = Number(form.getAttribute('data-seguimiento-form'));
        const notas = String(form.elements.notas.value || '').trim();
        const feedback = form.querySelector('.seguimiento-feedback');
        const button = form.querySelector('button[type="submit"]');

        if (feedback) {
          feedback.classList.add('d-none');
          feedback.textContent = '';
        }

        if (!notas) {
          if (feedback) {
            feedback.textContent = 'Agrega una nota u observacion del mentor.';
            feedback.classList.remove('d-none');
          }
          return;
        }

        if (button) button.disabled = true;
        try {
          await MentoriasApi.registrarSeguimiento({ id_inscripcion, notas });
          form.reset();
          await cargarSeguimiento(id_inscripcion);
        } catch (error) {
          if (feedback) {
            feedback.textContent = error.message || 'No se pudo guardar el seguimiento.';
            feedback.classList.remove('d-none');
          }
        } finally {
          if (button) button.disabled = false;
        }
      });
    });
  }

  function cargarSeguimientosAceptados(container) {
    if (!container) return;
    container.querySelectorAll('[data-seguimiento-id]').forEach((panel) => {
      cargarSeguimiento(panel.getAttribute('data-seguimiento-id'));
    });
  }

  function limpiarErrorMensajes() {
    if (!mensajesAlert) return;
    mensajesAlert.classList.add('d-none');
    mensajesAlert.textContent = '';
  }

  function mostrarErrorMensajes(message) {
    if (!mensajesAlert) return;
    mensajesAlert.textContent = message;
    mensajesAlert.classList.remove('d-none');
  }

  function renderizarInfoInscripcion(item) {
    if (!mensajesInfo) return;
    mensajesInfo.innerHTML = `
      <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div>
          <div class="fw-bold">${escaparHtml(item?.claseTitulo || 'Clase')}</div>
          <div class="text-muted small">${escaparHtml(obtenerNombreContraparte(item))}</div>
        </div>
        <span class="status-badge ${claseEstado(item?.estado)}">${escaparHtml(item?.estado || 'inscripcion')}</span>
      </div>
      <div class="text-muted small mt-2">
        <i class="bi bi-calendar-event me-1"></i>${escaparHtml(formatearFecha(item?.claseFecha))}
      </div>
    `;
  }

  function renderizarMensajes(mensajes) {
    if (!mensajesList) return;
    if (!Array.isArray(mensajes) || !mensajes.length) {
      mensajesList.innerHTML = '<div class="text-muted text-center py-4">Todavia no hay mensajes en esta inscripcion.</div>';
      return;
    }

    mensajesList.innerHTML = mensajes
      .map((mensaje) => {
        const esPropio = Number(mensaje.id_remitente || mensaje.id_usuario) === Number(user.id);
        const nombre = esPropio ? 'Vos' : mensaje.remitente_nombre || mensaje.remitenteNombre || obtenerNombreContraparte(inscripcionActiva);
        return `
          <article class="mensaje-burbuja ${esPropio ? 'mensaje-burbuja--propio' : 'mensaje-burbuja--recibido'}">
            <div class="mensaje-meta mb-1">${escaparHtml(nombre)} - ${escaparHtml(formatearFecha(mensaje.fecha_envio))}</div>
            <div>${escaparHtml(mensaje.contenido)}</div>
          </article>
        `;
      })
      .join('');

    mensajesList.scrollTop = mensajesList.scrollHeight;
  }

  async function cargarConversacionActiva() {
    if (!inscripcionActiva) return;
    limpiarErrorMensajes();
    if (mensajesList) {
      mensajesList.innerHTML = '<div class="text-muted text-center py-4">Cargando mensajes...</div>';
    }

    const response = await MentoriasApi.obtenerMensajesInscripcion(obtener_id_inscripcion(inscripcionActiva), user.id);
    renderizarMensajes(Array.isArray(response.data) ? response.data : []);
  }

  async function abrirMensajes(id_inscripcion) {
    const item = inscripcionesPorId.get(Number(id_inscripcion));
    if (!item || !mensajesModalElement) return;

    inscripcionActiva = item;
    limpiarErrorMensajes();
    if (mensajesContenido) mensajesContenido.value = '';
    if (mensajesModalTitle) mensajesModalTitle.textContent = 'Mensajes';
    if (mensajesModalSubtitle) {
      mensajesModalSubtitle.textContent = `Conversacion con ${obtenerNombreContraparte(item)}`;
    }
    renderizarInfoInscripcion(item);

    const modal = bootstrap.Modal.getOrCreateInstance(mensajesModalElement);
    modal.show();

    try {
      await cargarConversacionActiva();
    } catch (error) {
      renderizarMensajes([]);
      mostrarErrorMensajes(error.message || 'No se pudieron cargar los mensajes.');
    }
  }

  function adjuntarAccionesMensajes(container) {
    if (!container) return;
    container.querySelectorAll('[data-message-id]').forEach((button) => {
      button.addEventListener('click', () => abrirMensajes(button.getAttribute('data-message-id')));
    });
  }

  function adjuntarAccionesTabsMentor(container) {
    if (!container) return;
    container.querySelectorAll('[data-switch-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const tab = button.getAttribute('data-switch-tab');
        const id_inscripcion = Number(button.getAttribute('data-inscripcion-target'));
        activarTabMentor(tab);

        if (tab === 'seguimiento' && id_inscripcion) {
          const selector = document.getElementById('mentor-followup-select');
          if (selector) {
            selector.value = String(id_inscripcion);
            renderizarDetalleSeguimientoMentor(id_inscripcion);
          }
        }

        if (tab === 'materiales' && id_inscripcion) {
          const inscripcion = inscripcionesPorId.get(id_inscripcion);
          const selector = document.getElementById('mentor-material-class-select');
          if (selector && inscripcion?.id_clase) {
            selector.value = String(inscripcion.id_clase);
            renderizarMaterialesDeClase(Number(inscripcion.id_clase));
          }
        }
      });
    });
  }

  function construirTarjetaEstudiante(item) {
    const estado = item.estado || 'pendiente';
    const statusMessages = {
      pendiente: 'Tu solicitud esta pendiente de revision.',
      aceptada: 'Tu inscripcion fue aceptada.',
      rechazada: item.motivoRechazo || item.motivo_rechazo || 'Tu solicitud fue rechazada.',
    };
    const id_clase = Number(item.id_clase || 0);
    const id_inscripcion = obtener_id_inscripcion(item);
    const materia = item.materiaNombre || item.materia;
    const modalidad = item.modalidad || item.claseModalidad;
    const acceptedActions =
      estado === 'aceptada'
        ? `<a class="btn btn-outline-dark btn-sm rounded-pill px-3" href="/pages/detalle-clase.html?id=${encodeURIComponent(id_clase)}">Ver clase</a>`
        : '';
    const actions =
      estado === 'aceptada'
        ? `
          ${acceptedActions}
          <button class="btn btn-outline-dark btn-sm rounded-pill px-3" data-student-quick-tab="seguimiento" data-student-target="${escaparHtml(id_inscripcion)}" type="button">Ver seguimiento</button>
          <button class="btn btn-outline-dark btn-sm rounded-pill px-3" data-student-quick-tab="mensajes" data-student-target="${escaparHtml(id_inscripcion)}" type="button">Ver mensajes</button>
        `
        : '';
    const helperText = statusMessages[estado]
      ? `<p class="text-muted small mb-0 mt-2">${escaparHtml(statusMessages[estado])}</p>`
      : '';

    return `
      <article class="item-card p-3">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-2 flex-wrap">
          <div>
            <h3 class="h6 fw-bold mb-1">${escaparHtml(item.claseTitulo || 'Clase')}</h3>
            <p class="text-muted mb-1">${escaparHtml(item.mentorNombre || 'Mentorix')}</p>
          </div>
          <span class="status-badge ${claseEstado(estado)}">${escaparHtml(estado)}</span>
        </div>
        ${helperText}
        ${materia ? `<p class="text-muted small mb-1"><i class="bi bi-book me-1"></i>${escaparHtml(materia)}</p>` : ''}
        <p class="text-muted small mb-1">
          <i class="bi bi-calendar-event me-1"></i>${escaparHtml(formatearFecha(item.claseFecha))}
        </p>
        ${modalidad ? `<p class="text-muted small mb-1"><i class="bi bi-display me-1"></i>${escaparHtml(modalidad)}</p>` : ''}
        <p class="text-muted small mb-0">
          <i class="bi bi-clock-history me-1"></i>Solicitada: ${escaparHtml(formatearFecha(item.fechaSolicitud))}
        </p>
        ${actions ? `<div class="d-flex gap-2 flex-wrap mt-3">${actions}</div>` : ''}
      </article>
    `;
  }

  function renderizarResumenCardsEstudiante() {
    if (!studentSummaryCards) return;
    const metricas = calcularMetricasEstudiante(studentInscripciones);
    const cards = [
      ['Inscripciones realizadas', metricas.realizadas],
      ['Inscripciones pendientes', metricas.pendientes],
      ['Inscripciones aceptadas', metricas.aceptadas],
      ['Seguimientos disponibles', metricas.seguimientos],
    ];

    studentSummaryCards.innerHTML = cards
      .map(
        ([label, value]) => `
          <div class="col-12 col-md-6 col-xl-3">
            <div class="summary-mini-card">
              <span class="text-muted small">${escaparHtml(label)}</span>
              <strong>${escaparHtml(numeroSeguro(value))}</strong>
            </div>
          </div>
        `
      )
      .join('');
  }

  function renderResumenEstudiante() {
    if (!studentSummaryPanel) return;
    const metricas = calcularMetricasEstudiante(studentInscripciones);
    const resumen = metricas.realizadas
      ? `Tenes ${metricas.realizadas} inscripciones realizadas, ${metricas.pendientes} pendientes y ${metricas.aceptadas} aceptadas.`
      : 'Todavia no realizaste inscripciones.';

    studentSummaryPanel.innerHTML = `
      <div class="row g-4">
        <div class="col-12 col-lg-7">
          <div class="item-card p-4 h-100">
            <h3 class="h6 fw-bold mb-3">Resumen general</h3>
            <p class="text-muted mb-3">${escaparHtml(resumen)}</p>
            <div class="row g-3">
              <div class="col-6 col-md-3">
                <div class="student-stat">
                  <span>Realizadas</span>
                  <strong>${escaparHtml(metricas.realizadas)}</strong>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="student-stat">
                  <span>Pendientes</span>
                  <strong>${escaparHtml(metricas.pendientes)}</strong>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="student-stat">
                  <span>Aceptadas</span>
                  <strong>${escaparHtml(metricas.aceptadas)}</strong>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="student-stat">
                  <span>Rechazadas</span>
                  <strong>${escaparHtml(metricas.rechazadas)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-5">
          <div class="item-card p-4 h-100">
            <h3 class="h6 fw-bold mb-3">Accesos rapidos</h3>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-outline-dark rounded-pill px-4" data-student-quick-tab="inscripciones" type="button">Ver mis inscripciones</button>
              <button class="btn btn-outline-dark rounded-pill px-4" data-student-quick-tab="seguimiento" type="button">Ver seguimiento academico</button>
              <button class="btn btn-outline-dark rounded-pill px-4" data-student-quick-tab="mensajes" type="button">Ver mensajes</button>
            </div>
          </div>
        </div>
      </div>
    `;

    adjuntarAccesosRapidosEstudiante(studentSummaryPanel);
  }

  function adjuntarAccionesEstudiante(container) {
    if (!container) return;
    container.querySelectorAll('[data-student-quick-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const tab = button.getAttribute('data-student-quick-tab');
        const id_inscripcion = Number(button.getAttribute('data-student-target'));
        mostrarTabEstudiante(tab);

        if (tab === 'seguimiento' && id_inscripcion) {
          const selector = document.getElementById('student-followup-select');
          if (selector) {
            selector.value = String(id_inscripcion);
            renderizarDetalleSeguimientoEstudiante(id_inscripcion);
          }
        }

        if (tab === 'mensajes' && id_inscripcion) {
          seleccionarConversacionEstudiante(id_inscripcion);
        }
      });
    });
  }

  function renderInscripcionesEstudiante() {
    const pendientes = studentInscripciones.filter((item) => item.estado === 'pendiente');
    const aceptadas = studentInscripciones.filter((item) => item.estado === 'aceptada');
    const rechazadas = studentInscripciones.filter((item) => item.estado === 'rechazada');

    if (pendingList) {
      pendingList.innerHTML = pendientes.length
        ? pendientes.map(construirTarjetaEstudiante).join('')
        : '<div class="empty-state item-card p-3 text-muted text-center">No tenes inscripciones pendientes.</div>';
    }
    if (acceptedList) {
      acceptedList.innerHTML = aceptadas.length
        ? aceptadas.map(construirTarjetaEstudiante).join('')
        : '<div class="empty-state item-card p-3 text-muted text-center">Todavia no tenes clases aceptadas.</div>';
    }
    if (rejectedList) {
      rejectedList.innerHTML = rechazadas.length
        ? rechazadas.map(construirTarjetaEstudiante).join('')
        : '<div class="empty-state item-card p-3 text-muted text-center">No hay solicitudes rechazadas.</div>';
    }

    adjuntarAccionesEstudiante(pendingList);
    adjuntarAccionesEstudiante(acceptedList);
    adjuntarAccionesEstudiante(rejectedList);
  }

  function renderizarDetalleSeguimientoEstudiante(id_inscripcion) {
    const detail = document.getElementById('student-followup-detail');
    if (!detail) return;
    const item = inscripcionesPorId.get(Number(id_inscripcion));

    if (!item || item.estado !== 'aceptada') {
      detail.innerHTML = `
        <div class="empty-state item-card p-4 text-muted text-center">
          El seguimiento academico estara disponible cuando tengas una inscripcion aceptada.
        </div>
      `;
      return;
    }

    detail.innerHTML = `
      <article class="item-card p-4">
        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h4 class="h6 fw-bold mb-1">${escaparHtml(item.claseTitulo || 'Clase')}</h4>
            <p class="text-muted mb-0">${escaparHtml(item.mentorNombre || item.mentorEmail || 'Mentor')}</p>
          </div>
          <span class="status-badge status-aceptada">En curso</span>
        </div>
        ${construirPanelSeguimiento(item, false)}
        <div class="d-flex justify-content-end mt-3">
          <button class="btn btn-outline-dark rounded-pill px-4" data-student-quick-tab="mensajes" data-student-target="${escaparHtml(obtener_id_inscripcion(item))}" type="button">Enviar mensaje al mentor</button>
        </div>
      </article>
    `;

    adjuntarAccionesEstudiante(detail);
    cargarSeguimiento(obtener_id_inscripcion(item));
  }

  function renderSeguimientoEstudiante() {
    if (!studentFollowupPanel) return;
    const aceptadas = studentInscripciones.filter((item) => item.estado === 'aceptada');

    if (!aceptadas.length) {
      studentFollowupPanel.innerHTML = `
        <div class="empty-state item-card p-4 text-muted text-center">
          El seguimiento academico estara disponible cuando tengas una inscripcion aceptada.
        </div>
      `;
      return;
    }

    studentFollowupPanel.innerHTML = `
      <div class="row g-4">
        <div class="col-12 col-lg-4">
          <div class="item-card p-4">
            <label class="form-label fw-semibold" for="student-followup-select">Clase aceptada</label>
            <select id="student-followup-select" class="form-select">
              ${aceptadas
                .map(
                  (item) => `
                    <option value="${escaparHtml(obtener_id_inscripcion(item))}">${escaparHtml(item.claseTitulo || 'Clase')} - ${escaparHtml(item.mentorNombre || 'Mentor')}</option>
                  `
                )
                .join('')}
            </select>
          </div>
        </div>
        <div class="col-12 col-lg-8">
          <div id="student-followup-detail"></div>
        </div>
      </div>
    `;

    const selector = document.getElementById('student-followup-select');
    if (selector) {
      selector.addEventListener('change', () => renderizarDetalleSeguimientoEstudiante(selector.value));
      renderizarDetalleSeguimientoEstudiante(selector.value || obtener_id_inscripcion(aceptadas[0]));
    }
  }

  async function cargarMensajesEstudiantePanel(id_inscripcion) {
    const list = document.getElementById('student-inline-messages-list');
    if (!list) return;
    list.innerHTML = '<div class="text-muted text-center py-4">Cargando mensajes...</div>';

    try {
      const response = await MentoriasApi.obtenerMensajesInscripcion(id_inscripcion, user.id);
      const mensajes = Array.isArray(response.data) ? response.data : [];
      if (!mensajes.length) {
        list.innerHTML = '<div class="text-muted text-center py-4">Todavia no hay mensajes en esta inscripcion.</div>';
        return;
      }

      list.innerHTML = mensajes
        .map((mensaje) => {
          const esPropio = Number(mensaje.id_remitente || mensaje.id_usuario) === Number(user.id);
          const nombre = esPropio ? 'Vos' : mensaje.remitente_nombre || mensaje.remitenteNombre || obtenerNombreContraparte(studentMensajeActivo);
          return `
            <article class="mensaje-burbuja ${esPropio ? 'mensaje-burbuja--propio' : 'mensaje-burbuja--recibido'}">
              <div class="mensaje-meta mb-1">${escaparHtml(nombre)} - ${escaparHtml(formatearFecha(mensaje.fecha_envio))}</div>
              <div>${escaparHtml(mensaje.contenido)}</div>
            </article>
          `;
        })
        .join('');
      list.scrollTop = list.scrollHeight;
    } catch (error) {
      list.innerHTML = `<div class="text-danger text-center py-4">${escaparHtml(error.message || 'No se pudieron cargar los mensajes.')}</div>`;
    }
  }

  function renderizarConversacionEstudiante(item) {
    const detail = document.getElementById('student-message-detail');
    if (!detail) return;
    if (!item) {
      detail.innerHTML = `
        <div class="item-card p-4 h-100">
          <h4 class="h6 fw-bold mb-3">Conversacion</h4>
          <div class="text-muted mb-3">Selecciona una conversacion para abrir el historial de mensajes.</div>
          <textarea class="form-control mb-3" rows="4" placeholder="Escribi tu mensaje" disabled></textarea>
          <div class="d-flex justify-content-end">
            <button class="btn btn-dark rounded-pill px-4" type="button" disabled>Enviar</button>
          </div>
        </div>
      `;
      return;
    }

    const id_inscripcion = obtener_id_inscripcion(item);
    detail.innerHTML = `
      <div class="item-card p-4 h-100">
        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
          <div>
            <h4 class="h6 fw-bold mb-1">${escaparHtml(item.claseTitulo || 'Clase')}</h4>
            <p class="text-muted small mb-0">${escaparHtml(item.mentorNombre || item.mentorEmail || 'Mentor')}</p>
          </div>
          <span class="status-badge ${claseEstado(item.estado)}">${escaparHtml(item.estado || 'aceptada')}</span>
        </div>
        <div id="student-inline-messages-list" class="mensajes-list d-grid gap-2 mb-3"></div>
        <form id="student-inline-message-form" class="d-grid gap-2">
          <label class="form-label fw-semibold mb-0" for="student-inline-message-content">Nuevo mensaje</label>
          <textarea id="student-inline-message-content" class="form-control" name="contenido" rows="3" maxlength="1000" placeholder="Escribi tu mensaje"></textarea>
          <div class="student-inline-message-feedback text-danger small d-none" role="alert"></div>
          <div class="d-flex justify-content-end">
            <button class="btn btn-dark rounded-pill px-4" type="submit">
              <i class="bi bi-send me-1"></i>Enviar
            </button>
          </div>
        </form>
      </div>
    `;

    const form = document.getElementById('student-inline-message-form');
    const feedback = detail.querySelector('.student-inline-message-feedback');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const contenido = String(form.elements.contenido.value || '').trim();
        const button = form.querySelector('button[type="submit"]');

        if (feedback) {
          feedback.classList.add('d-none');
          feedback.textContent = '';
        }

        if (!contenido) {
          if (feedback) {
            feedback.textContent = 'Escribi un mensaje antes de enviarlo.';
            feedback.classList.remove('d-none');
          }
          return;
        }

        if (button) button.disabled = true;
        try {
          await MentoriasApi.enviarMensajeInscripcion(id_inscripcion, {
            id_usuario: user.id,
            contenido,
          });
          form.reset();
          await cargarMensajesEstudiantePanel(id_inscripcion);
        } catch (error) {
          if (feedback) {
            feedback.textContent = error.message || 'No se pudo enviar el mensaje.';
            feedback.classList.remove('d-none');
          }
        } finally {
          if (button) button.disabled = false;
        }
      });
    }

    cargarMensajesEstudiantePanel(id_inscripcion);
  }

  function seleccionarConversacionEstudiante(id_inscripcion) {
    const item = inscripcionesPorId.get(Number(id_inscripcion));
    if (!item || item.estado !== 'aceptada') return;
    studentMensajeActivo = item;
    renderizarConversacionEstudiante(item);
    document.querySelectorAll('[data-student-conversation-id]').forEach((button) => {
      button.classList.toggle('is-active', Number(button.getAttribute('data-student-conversation-id')) === Number(id_inscripcion));
    });
  }

  function renderMensajesEstudiante() {
    if (!studentMessagesPanel) return;
    const conversaciones = studentInscripciones.filter((item) => item.estado === 'aceptada');

    if (!conversaciones.length) {
      studentMessagesPanel.innerHTML = `
        <div class="empty-state item-card p-4 text-muted text-center">
          No tenes mensajes disponibles por el momento.
        </div>
      `;
      studentMensajeActivo = null;
      return;
    }

    const activa = studentMensajeActivo && conversaciones.some((item) => obtener_id_inscripcion(item) === obtener_id_inscripcion(studentMensajeActivo))
      ? studentMensajeActivo
      : conversaciones[0];
    studentMensajeActivo = activa;

    studentMessagesPanel.innerHTML = `
      <div class="row g-4">
        <div class="col-12 col-lg-5">
          <div class="item-card p-4 h-100">
            <h4 class="h6 fw-bold mb-3">Conversaciones</h4>
            <div class="d-grid gap-2">
              ${conversaciones
                .map((item) => {
                  const id_inscripcion = obtener_id_inscripcion(item);
                  const activaClase = id_inscripcion === obtener_id_inscripcion(activa) ? ' is-active' : '';
                  return `
                    <button class="conversation-row${activaClase}" data-student-conversation-id="${escaparHtml(id_inscripcion)}" type="button">
                      <span class="fw-semibold">${escaparHtml(item.claseTitulo || 'Clase')}</span>
                      <span class="text-muted small">${escaparHtml(item.mentorNombre || item.mentorEmail || 'Mentor')}</span>
                      <span class="status-badge ${claseEstado(item.estado)}">${escaparHtml(item.estado)}</span>
                    </button>
                  `;
                })
                .join('')}
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-7">
          <div id="student-message-detail"></div>
        </div>
      </div>
    `;

    studentMessagesPanel.querySelectorAll('[data-student-conversation-id]').forEach((button) => {
      button.addEventListener('click', () => seleccionarConversacionEstudiante(button.getAttribute('data-student-conversation-id')));
    });
    renderizarConversacionEstudiante(activa);
  }

  function renderPanelEstudiante() {
    renderizarResumenCardsEstudiante();
    renderResumenEstudiante();
    renderInscripcionesEstudiante();
    renderSeguimientoEstudiante();
    renderMensajesEstudiante();
    mostrarTabEstudiante(studentTabActiva);
  }

  function construirTarjetaPendienteMentor(item) {
    return `
      <article class="item-card p-3">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-2 flex-wrap">
          <div>
            <h3 class="h6 fw-bold mb-1">${escaparHtml(item.claseTitulo || 'Clase')}</h3>
            <p class="text-muted mb-1">${escaparHtml(item.usuarioNombre || item.usuarioEmail || 'Estudiante')}</p>
            <p class="text-muted small mb-0">${escaparHtml(formatearFecha(item.fechaSolicitud))}</p>
          </div>
          <span class="status-badge ${claseEstado(item.estado)}">${escaparHtml(item.estado)}</span>
        </div>
        <p class="text-muted small mb-3">${escaparHtml(item.claseDescripcion || '')}</p>
        <div class="mentor-actions d-flex gap-2 flex-wrap">
          <button class="btn btn-success" data-action="aceptada" data-id="${escaparHtml(obtener_id_inscripcion(item))}" type="button">Aceptar</button>
          <button class="btn btn-outline-danger" data-action="rechazada" data-id="${escaparHtml(obtener_id_inscripcion(item))}" type="button">Rechazar</button>
        </div>
      </article>
    `;
  }

  function construirTarjetaHistorialMentor(item) {
    const id_inscripcion = obtener_id_inscripcion(item);
    const acciones =
      item.estado === 'aceptada'
        ? `
          ${construirBotonMensajes(item)}
          ${construirBotonTabMentor('seguimiento', 'Seguimiento', id_inscripcion)}
          ${construirBotonTabMentor('materiales', 'Materiales', id_inscripcion)}
        `
        : '';
    const motivo =
      item.estado === 'rechazada' && (item.motivoRechazo || item.motivo_rechazo)
        ? `<p class="text-danger small mb-0">Motivo: ${escaparHtml(item.motivoRechazo || item.motivo_rechazo)}</p>`
        : '';

    return `
      <article class="item-card p-3">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-2 flex-wrap">
          <div>
            <h3 class="h6 fw-bold mb-1">${escaparHtml(item.claseTitulo || 'Clase')}</h3>
            <p class="text-muted mb-1">${escaparHtml(item.usuarioNombre || item.usuarioEmail || 'Estudiante')}</p>
            <p class="text-muted small mb-0">${escaparHtml(formatearFecha(item.fechaSolicitud))}</p>
          </div>
          <span class="status-badge ${claseEstado(item.estado)}">${escaparHtml(item.estado)}</span>
        </div>
        ${motivo}
        <div class="d-flex gap-2 flex-wrap mt-3">${acciones}</div>
      </article>
    `;
  }

  function construirTarjetaClaseMentor(clase) {
    const id_clase = obtener_id_clase(clase);
    const cupo_actual = Number(clase.cupo_actual || clase.inscriptos || 0);
    const cupo_maximo = Number(clase.cupo_maximo || clase.cupo || 0);
    const completa = cupo_maximo ? cupo_actual >= cupo_maximo : false;
    const fechaTexto = formatearFecha(clase.fecha);

    return `
      <div class="col-12 col-lg-6">
        <article class="item-card p-4 h-100">
          <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h3 class="h6 fw-bold mb-1">${escaparHtml(clase.titulo || 'Clase')}</h3>
              <p class="text-muted mb-0">${escaparHtml(clase.materiaNombre || clase.materia || 'Materia')}</p>
            </div>
            <span class="status-badge ${completa ? 'status-rechazada' : 'status-aceptada'}">${completa ? 'Cupo completo' : 'Disponible'}</span>
          </div>
          <div class="mentor-class-meta d-grid gap-2 text-muted small">
            <div><i class="bi bi-calendar-event me-2"></i>${escaparHtml(fechaTexto)}</div>
            <div><i class="bi bi-display me-2"></i>${escaparHtml(clase.modalidad || 'Modalidad pendiente')}</div>
            <div><i class="bi bi-people me-2"></i>${escaparHtml(cupo_maximo ? `${cupo_actual} / ${cupo_maximo}` : 'Sin cupo definido')}</div>
            ${clase.ubicacion ? `<div><i class="bi bi-geo-alt me-2"></i>${escaparHtml(clase.ubicacion)}</div>` : ''}
          </div>
          <div class="d-flex gap-2 flex-wrap mt-3">
            <a class="btn btn-outline-dark btn-sm rounded-pill px-3" href="/pages/detalle-clase.html?id=${encodeURIComponent(id_clase)}">Ver detalle</a>
            <a class="btn btn-outline-dark btn-sm rounded-pill px-3" href="/pages/crear-clase.html?id=${encodeURIComponent(id_clase)}">Editar</a>
          </div>
        </article>
      </div>
    `;
  }

  function renderizarResumenCardsMentor() {
    if (!mentorSummaryCards) return;
    const pendientes = mentorInscripciones.filter((item) => item.estado === 'pendiente').length;
    const aceptadas = mentorInscripciones.filter((item) => item.estado === 'aceptada').length;
    const cards = [
      ['Clases publicadas', mentorClases.length],
      ['Solicitudes pendientes', pendientes],
      ['Inscripciones aceptadas', aceptadas],
      ['Seguimientos activos', aceptadas],
    ];

    mentorSummaryCards.innerHTML = cards
      .map(
        ([label, value]) => `
          <div class="col-12 col-md-6 col-xl-3">
            <div class="summary-mini-card">
              <span class="text-muted small">${escaparHtml(label)}</span>
              <strong>${escaparHtml(value)}</strong>
            </div>
          </div>
        `
      )
      .join('');
  }

  function renderResumenMentor() {
    if (!mentorSummaryPanel) return;
    mentorSummaryPanel.innerHTML = `
      <div class="row g-4">
        <div class="col-12 col-lg-6">
          <div class="item-card p-4 h-100">
            <h3 class="h6 fw-bold mb-3">Resumen general</h3>
            <p class="text-muted mb-0">Tenes ${mentorClases.length} clases publicadas y ${mentorInscripciones.filter((item) => item.estado === 'pendiente').length} solicitudes pendientes.</p>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <div class="item-card p-4 h-100">
            <h3 class="h6 fw-bold mb-3">Accesos rapidos</h3>
            <div class="d-flex gap-2 flex-wrap">
              <a class="btn btn-dark rounded-pill px-4" href="/pages/crear-clase.html">Crear clase</a>
              <button class="btn btn-outline-dark rounded-pill px-4" data-quick-tab="solicitudes" type="button">Ver solicitudes</button>
              <button class="btn btn-outline-dark rounded-pill px-4" data-quick-tab="seguimiento" type="button">Ver seguimientos</button>
              <button class="btn btn-outline-dark rounded-pill px-4" data-quick-tab="mensajes" type="button">Ver mensajes</button>
              <button class="btn btn-outline-dark rounded-pill px-4" data-quick-tab="materiales" type="button">Ver materiales</button>
            </div>
          </div>
        </div>
      </div>
    `;

    mentorSummaryPanel.querySelectorAll('[data-quick-tab]').forEach((button) => {
      button.addEventListener('click', () => activarTabMentor(button.getAttribute('data-quick-tab')));
    });
  }

  function renderClasesMentor() {
    if (!mentorClassesList) return;
    mentorClassesList.innerHTML = mentorClases.length
      ? mentorClases.map(construirTarjetaClaseMentor).join('')
      : '<div class="col-12"><div class="item-card p-4 text-muted text-center">Todavia no publicaste clases.</div></div>';
  }

  function renderSolicitudesMentor() {
    const pendientes = mentorInscripciones.filter((item) => item.estado === 'pendiente');
    const aceptadas = mentorInscripciones.filter((item) => item.estado === 'aceptada');
    const rechazadas = mentorInscripciones.filter((item) => item.estado === 'rechazada');

    if (mentorPendingList) {
      mentorPendingList.innerHTML = pendientes.length
        ? pendientes.map(construirTarjetaPendienteMentor).join('')
        : '<div class="item-card p-3 text-muted text-center">No hay solicitudes pendientes.</div>';
    }
    if (mentorAcceptedList) {
      mentorAcceptedList.innerHTML = aceptadas.length
        ? aceptadas.map(construirTarjetaHistorialMentor).join('')
        : '<div class="item-card p-3 text-muted text-center">No hay inscripciones aceptadas.</div>';
    }
    if (mentorRejectedList) {
      mentorRejectedList.innerHTML = rechazadas.length
        ? rechazadas.map(construirTarjetaHistorialMentor).join('')
        : '<div class="item-card p-3 text-muted text-center">No hay solicitudes rechazadas.</div>';
    }

    adjuntarAccionesMentor(mentorPendingList);
    adjuntarAccionesMensajes(mentorAcceptedList);
    adjuntarAccionesTabsMentor(mentorAcceptedList);
  }

  function renderizarDetalleSeguimientoMentor(id_inscripcion) {
    const detail = document.getElementById('mentor-followup-detail');
    if (!detail) return;
    const item = inscripcionesPorId.get(Number(id_inscripcion));

    if (!item || item.estado !== 'aceptada') {
      detail.innerHTML = `
        <div class="item-card p-4 text-muted text-center">
          Selecciona una inscripcion aceptada para consultar o registrar el seguimiento academico.
        </div>
      `;
      return;
    }

    detail.innerHTML = `
      <article class="item-card p-4">
        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h4 class="h6 fw-bold mb-1">${escaparHtml(item.claseTitulo || 'Clase')}</h4>
            <p class="text-muted mb-0">${escaparHtml(item.usuarioNombre || item.usuarioEmail || 'Estudiante')}</p>
          </div>
          <span class="status-badge status-aceptada">aceptada</span>
        </div>
        ${construirPanelSeguimiento(item, true)}
      </article>
    `;

    adjuntarFormulariosSeguimiento(detail);
    cargarSeguimiento(obtener_id_inscripcion(item));
  }

  function renderSeguimientoMentor() {
    if (!mentorFollowupPanel) return;
    const aceptadas = obtenerInscripcionesAceptadas();

    mentorFollowupPanel.innerHTML = `
      <div class="row g-4">
        <div class="col-12 col-lg-4">
          <div class="item-card p-4">
            <label class="form-label fw-semibold" for="mentor-followup-select">Inscripcion aceptada</label>
            <select id="mentor-followup-select" class="form-select">
              <option value="">Selecciona una inscripcion</option>
              ${aceptadas
                .map(
                  (item) => `
                    <option value="${escaparHtml(obtener_id_inscripcion(item))}">${escaparHtml(item.claseTitulo || 'Clase')} - ${escaparHtml(item.usuarioNombre || item.usuarioEmail || 'Estudiante')}</option>
                  `
                )
                .join('')}
            </select>
          </div>
        </div>
        <div class="col-12 col-lg-8">
          <div id="mentor-followup-detail">
            <div class="item-card p-4 text-muted text-center">
              ${
                aceptadas.length
                  ? 'Selecciona una inscripcion aceptada para consultar o registrar el seguimiento academico.'
                  : 'El seguimiento academico esta disponible unicamente para inscripciones aceptadas.'
              }
            </div>
          </div>
        </div>
      </div>
    `;

    const selector = document.getElementById('mentor-followup-select');
    if (selector) {
      selector.addEventListener('change', () => renderizarDetalleSeguimientoMentor(selector.value));
    }
  }

  function renderMensajesMentor() {
    if (!mentorMessagesPanel) return;
    const conversaciones = mentorInscripciones;

    mentorMessagesPanel.innerHTML = `
      <div class="row g-4">
        <div class="col-12 col-lg-5">
          <div class="item-card p-4 h-100">
            <h4 class="h6 fw-bold mb-3">Conversaciones</h4>
            <div class="d-grid gap-2">
              ${
                conversaciones.length
                  ? conversaciones
                      .map(
                        (item) => `
                          <button class="conversation-row" data-message-id="${escaparHtml(obtener_id_inscripcion(item))}" type="button">
                            <span class="fw-semibold">${escaparHtml(item.claseTitulo || 'Clase')}</span>
                            <span class="text-muted small">${escaparHtml(obtenerNombreContraparte(item))}</span>
                            <span class="status-badge ${claseEstado(item.estado)}">${escaparHtml(item.estado)}</span>
                          </button>
                        `
                      )
                      .join('')
                  : '<div class="text-muted text-center py-3">No hay conversaciones disponibles.</div>'
              }
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-7">
          <div class="item-card p-4 h-100">
            <h4 class="h6 fw-bold mb-3">Area de conversacion</h4>
            <div class="text-muted mb-3">Selecciona una conversacion para abrir el historial de mensajes.</div>
            <textarea class="form-control mb-3" rows="4" placeholder="Escribi tu mensaje" disabled></textarea>
            <div class="d-flex justify-content-end">
              <button class="btn btn-dark rounded-pill px-4" type="button" disabled>Enviar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    adjuntarAccionesMensajes(mentorMessagesPanel);
  }

  function renderizarMaterialesDeClase(id_clase) {
    const list = document.getElementById('mentor-materials-list');
    if (!list) return;
    const materiales = mentorMateriales.filter((material) => Number(material.id_clase) === Number(id_clase));

    if (!id_clase) {
      list.innerHTML = '<div class="item-card p-4 text-muted text-center">Selecciona una clase para ver o cargar materiales.</div>';
      return;
    }

    list.innerHTML = materiales.length
      ? materiales
          .map(
            (material) => `
              <article class="item-card p-3">
                <div class="fw-semibold">${escaparHtml(material.titulo || 'Material')}</div>
                ${material.descripcion ? `<p class="text-muted small mb-1">${escaparHtml(material.descripcion)}</p>` : ''}
                ${
                  material.url
                    ? `<a class="small" href="${escaparHtml(material.url)}" target="_blank" rel="noopener">Abrir material</a>`
                    : '<div class="text-muted small">Sin enlace cargado.</div>'
                }
              </article>
            `
          )
          .join('')
      : '<div class="item-card p-4 text-muted text-center">No hay materiales cargados para esta clase.</div>';
  }

  function renderMaterialesMentor() {
    if (!mentorMaterialsPanel) return;

    mentorMaterialsPanel.innerHTML = `
      <div class="row g-4">
        <div class="col-12 col-lg-4">
          <div class="item-card p-4">
            <label class="form-label fw-semibold" for="mentor-material-class-select">Clase</label>
            <select id="mentor-material-class-select" class="form-select mb-3">
              <option value="">Selecciona una clase</option>
              ${mentorClases
                .map((clase) => `<option value="${escaparHtml(obtener_id_clase(clase))}">${escaparHtml(clase.titulo || 'Clase')}</option>`)
                .join('')}
            </select>
            <form id="mentor-material-form" class="d-grid gap-2">
              <label class="form-label fw-semibold mb-0" for="mentor-material-title">Titulo</label>
              <input id="mentor-material-title" class="form-control" name="titulo" type="text" placeholder="Nombre del material" />
              <label class="form-label fw-semibold mb-0" for="mentor-material-url">URL</label>
              <input id="mentor-material-url" class="form-control" name="url" type="url" placeholder="https://..." />
              <button class="btn btn-dark rounded-pill px-4 mt-2" type="submit">Guardar material</button>
              <div class="mentor-material-feedback text-danger small d-none" role="alert"></div>
            </form>
          </div>
        </div>
        <div class="col-12 col-lg-8">
          <div id="mentor-materials-list" class="d-grid gap-3">
            <div class="item-card p-4 text-muted text-center">Selecciona una clase para ver o cargar materiales.</div>
          </div>
        </div>
      </div>
    `;

    const selector = document.getElementById('mentor-material-class-select');
    const form = document.getElementById('mentor-material-form');
    const feedback = mentorMaterialsPanel.querySelector('.mentor-material-feedback');

    if (selector) {
      selector.addEventListener('change', () => renderizarMaterialesDeClase(Number(selector.value)));
    }

    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id_clase = Number(selector?.value);
        const titulo = String(form.elements.titulo.value || '').trim();
        const url = String(form.elements.url.value || '').trim();

        if (feedback) {
          feedback.classList.add('d-none');
          feedback.textContent = '';
        }

        if (!id_clase) {
          if (feedback) {
            feedback.textContent = 'Selecciona una clase para cargar materiales.';
            feedback.classList.remove('d-none');
          }
          return;
        }

        if (!titulo) {
          if (feedback) {
            feedback.textContent = 'El titulo del material es obligatorio.';
            feedback.classList.remove('d-none');
          }
          return;
        }

        try {
          const response = await MentoriasApi.crearMaterial({ id_clase, titulo, url });
          if (response.data) mentorMateriales.push(response.data);
          form.reset();
          selector.value = String(id_clase);
          renderizarMaterialesDeClase(id_clase);
        } catch (error) {
          if (feedback) {
            feedback.textContent = error.message || 'No se pudo guardar el material.';
            feedback.classList.remove('d-none');
          }
        }
      });
    }
  }

  async function cargarDashboardEstudiante() {
    if (metricsRow) metricsRow.classList.add('d-none');
    if (studentDashboard) studentDashboard.classList.remove('d-none');

    const response = await MentoriasApi.buscarInscripcionesDelEstudiante(user.id);
    studentInscripciones = Array.isArray(response.data) ? response.data : [];
    inscripcionesPorId.clear();
    studentInscripciones.forEach((item) => inscripcionesPorId.set(obtener_id_inscripcion(item), item));
    actualizarMetricas(studentInscripciones);
    renderPanelEstudiante();
  }

  function adjuntarAccionesMentor(container) {
    if (!container) return;
    container.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', async function () {
        const id_inscripcion = Number(this.getAttribute('data-id'));
        const estado = this.getAttribute('data-action');
        if (!id_inscripcion || !estado) return;
        const confirmarCambio = window.confirm(
          estado === 'aceptada'
            ? 'La solicitud pasara a estar aceptada para el estudiante.'
            : 'La solicitud pasara a estar rechazada para el estudiante.'
        );
        if (!confirmarCambio) return;

        this.disabled = true;
        limpiarError();

        try {
          await MentoriasApi.actualizarEstadoInscripcion(id_inscripcion, { estado, id_mentor: user.id });
          await cargarDashboardMentor();
        } catch (error) {
          this.disabled = false;
          mostrarError(error.message || 'No se pudo actualizar la inscripcion.');
        }
      });
    });
  }

  async function cargarDashboardMentor() {
    if (metricsRow) metricsRow.classList.add('d-none');
    if (mentorDashboard) mentorDashboard.classList.remove('d-none');

    const [responseInscripciones, responseClases] = await Promise.all([
      MentoriasApi.buscarSolicitudesDelMentor(user.id),
      MentoriasApi.obtenerClases({ id_mentor: user.id }),
    ]);

    let responseMateriales = { data: [] };
    try {
      responseMateriales = await MentoriasApi.listarMateriales();
    } catch (error) {
      console.warn('No se pudieron cargar materiales:', error);
    }

    mentorInscripciones = Array.isArray(responseInscripciones.data) ? responseInscripciones.data : [];
    mentorClases = Array.isArray(responseClases.data)
      ? responseClases.data.filter((clase) => Number(clase.id_mentor) === Number(user.id))
      : [];
    mentorMateriales = Array.isArray(responseMateriales.data) ? responseMateriales.data : [];

    inscripcionesPorId.clear();
    mentorInscripciones.forEach((item) => inscripcionesPorId.set(obtener_id_inscripcion(item), item));
    actualizarMetricas(mentorInscripciones);
    renderizarResumenCardsMentor();
    renderResumenMentor();
    renderClasesMentor();
    renderSolicitudesMentor();
    renderSeguimientoMentor();
    renderMensajesMentor();
    renderMaterialesMentor();
    activarTabMentor(mentorTabActiva);
  }

  try {
    limpiarError();
    inicializarTabsEstudiante();
    vincularTabsMentor();

    if (user.rol === 'mentor') {
      await cargarDashboardMentor();
    } else {
      await cargarDashboardEstudiante();
    }
  } catch (error) {
    mostrarError(error.message || 'No pudimos cargar tu dashboard.');
  }

  if (mensajesForm) {
    mensajesForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!inscripcionActiva) return;

      const contenido = String(mensajesContenido?.value || '').trim();
      if (!contenido) {
        mostrarErrorMensajes('Escribi un mensaje antes de enviarlo.');
        return;
      }

      limpiarErrorMensajes();
      if (mensajesEnviar) mensajesEnviar.disabled = true;

      try {
        await MentoriasApi.enviarMensajeInscripcion(obtener_id_inscripcion(inscripcionActiva), {
          id_usuario: user.id,
          contenido,
        });
        if (mensajesContenido) mensajesContenido.value = '';
        await cargarConversacionActiva();
      } catch (error) {
        mostrarErrorMensajes(error.message || 'No se pudo enviar el mensaje.');
      } finally {
        if (mensajesEnviar) mensajesEnviar.disabled = false;
      }
    });
  }
})();
