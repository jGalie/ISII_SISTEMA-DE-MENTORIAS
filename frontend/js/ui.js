/**
 * UI compartida Mentorix.
 */
(function (global) {
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function activeKeyFromPath(pathname) {
    if (pathname.endsWith('/inicio-estudiante.html')) return 'inicio';
    if (pathname.endsWith('/dashboard.html')) return 'dashboard';
    if (pathname.endsWith('/clases.html')) return 'clases';
    if (pathname.endsWith('/crear-clase.html')) return 'crear';
    if (pathname.endsWith('/detalle-clase.html')) return 'clases';
    if (pathname.endsWith('/perfil.html')) return 'perfil';
    if (pathname.endsWith('/login.html')) return 'login';
    if (pathname.endsWith('/register.html')) return 'register';
    return 'inicio';
  }

  function modalityLabel(value) {
    return value === 'presencial' ? 'Presencial' : 'Virtual';
  }

  function navbarHtml({ user, activeKey }) {
    const homePath =
      user && global.MentoriasAuth ? global.MentoriasAuth.getHomePath(user) : '/index.html';
    const brand = `
      <a class="navbar-brand fw-bold d-flex align-items-center gap-2" href="${homePath}">
        <span class="mentorix-brand-mark rounded-4 d-inline-flex align-items-center justify-content-center text-white">
          <i class="bi bi-mortarboard-fill"></i>
        </span>
        <span class="fs-4 text-dark">Mentorix</span>
      </a>
    `;

    if (!user) {
      return `
<nav class="mentorix-navbar navbar navbar-expand-lg border-bottom sticky-top">
  <div class="container py-2">
    ${brand}
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain" aria-controls="navMain" aria-expanded="false" aria-label="Abrir navegación">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navMain">
      <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-2">
        <li class="nav-item"><a class="nav-link ${activeKey === 'inicio' ? 'active fw-semibold' : ''}" href="/index.html">Inicio</a></li>
        <li class="nav-item"><a class="nav-link ${activeKey === 'login' ? 'active fw-semibold' : ''}" href="/pages/login.html">Iniciar sesión</a></li>
        <li class="nav-item"><a class="btn btn-dark rounded-pill px-4" href="/pages/register.html">Registrarse</a></li>
      </ul>
    </div>
  </div>
</nav>`;
    }

    const createLink =
      user.rol === 'mentor'
        ? `<li class="nav-item"><a class="nav-link ${activeKey === 'crear' ? 'active fw-semibold' : ''}" href="/pages/crear-clase.html">Crear clase</a></li>`
        : '';
    const roleLabel = user.rol === 'estudiante' ? 'Estudiante' : 'Mentor';
    const roleIcon = user.rol === 'estudiante' ? 'bi-person-badge' : 'bi-person-workspace';
    const firstName = esc((user.nombre || '').split(' ')[0] || user.email || 'Usuario');

    if (user.rol === 'estudiante') {
      return `
<nav class="mentorix-navbar navbar navbar-expand-lg border-bottom sticky-top">
  <div class="container py-2">
    ${brand}
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain" aria-controls="navMain" aria-expanded="false" aria-label="Abrir navegación">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navMain">
      <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-3">
        <li class="nav-item"><a class="nav-link fw-semibold ${activeKey === 'dashboard' ? 'active' : ''}" href="/pages/dashboard.html">Mis inscripciones</a></li>
        <li class="nav-item dropdown">
          <button class="btn btn-brand px-4 py-2 dropdown-toggle d-inline-flex align-items-center gap-2" id="user-menu" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi ${roleIcon}"></i>
            <span>${firstName}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="user-menu">
            <li><h6 class="dropdown-header">${esc(user.email || roleLabel)}</h6></li>
            <li><a class="dropdown-item" href="/pages/perfil.html"><i class="bi bi-person-gear me-2"></i>Modificar perfil</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><button id="btn-logout" class="dropdown-item" type="button"><i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión</button></li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</nav>`;
    }

    return `
<nav class="mentorix-navbar navbar navbar-expand-lg border-bottom sticky-top">
  <div class="container py-2">
    ${brand}
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain" aria-controls="navMain" aria-expanded="false" aria-label="Abrir navegación">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navMain">
      <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-2">
        <li class="nav-item"><a class="nav-link ${activeKey === 'dashboard' ? 'active fw-semibold' : ''}" href="/pages/dashboard.html">Mis mentorias</a></li>
        ${createLink}
        <li class="nav-item dropdown">
          <button class="btn btn-outline-dark rounded-pill px-3 dropdown-toggle d-flex align-items-center gap-2" id="user-menu" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi ${roleIcon}"></i>
            <span>${firstName}</span>
            <span class="role-pill">${roleLabel}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="user-menu">
            <li><h6 class="dropdown-header">${esc(user.email || roleLabel)}</h6></li>
            <li><a class="dropdown-item" href="/pages/perfil.html"><i class="bi bi-person-gear me-2"></i>Modificar perfil</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><button id="btn-logout" class="dropdown-item" type="button"><i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión</button></li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</nav>`;
  }

  async function mountNavbar() {
    const host = document.querySelector('[data-component="navbar"]');
    if (!host) return;

    const user = global.MentoriasAuth ? global.MentoriasAuth.getUser() : null;
    const activeKey = activeKeyFromPath(window.location.pathname);
    host.innerHTML = navbarHtml({ user, activeKey });

    const logoutButton = document.getElementById('btn-logout');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        global.MentoriasAuth.logout();
        window.location.href = '/index.html';
      });
    }
  }

  function renderClasesCards(container, clases, options = {}) {
    if (!container) return;

    const {
      showMentorActions = false,
      showStudentEnrollment = false,
      currentUser = null,
      enrollmentByClassId = {},
    } = options;

    if (!Array.isArray(clases) || !clases.length) {
      container.innerHTML = '<div class="text-muted">No hay clases disponibles.</div>';
      return;
    }

    const cards = clases
      .map((clase) => {
        const canManage =
          showMentorActions &&
          currentUser &&
          currentUser.rol === 'mentor' &&
          Number(currentUser.id) === Number(clase.mentorId);
        const canEnroll =
          showStudentEnrollment &&
          currentUser &&
          currentUser.rol === 'estudiante' &&
          Number(currentUser.id) !== Number(clase.mentorId);
        const enrollment = enrollmentByClassId[clase.id];
        const enrollmentLabels = {
          pendiente: 'Solicitud pendiente',
          aceptada: 'Inscripción aceptada',
          rechazada: 'Solicitud rechazada',
        };
        const enrollmentAction = enrollment
          ? `<button class="btn btn-outline-secondary btn-sm rounded-pill px-3" type="button" disabled>${esc(enrollmentLabels[enrollment.estado] || 'Inscripción registrada')}</button>`
          : '';
        const enrollButton =
          canEnroll && !enrollment
            ? `<button class="btn btn-dark btn-sm rounded-pill px-3 enroll-clase-btn" data-id="${encodeURIComponent(clase.id)}" type="button">Inscribirse</button>`
            : enrollmentAction;

        return `
<div class="col">
  <div class="clase-card-shell card border-0 h-100">
    <div class="card-body d-flex flex-column p-4">
      <div class="d-flex justify-content-between align-items-start gap-3 mb-2">
        <div>
          <h5 class="card-title fw-bold mb-1">${esc(clase.titulo)}</h5>
          <div class="text-muted small"><i class="bi bi-person-circle me-1"></i>${esc(clase.mentorNombre || 'Mentor')}</div>
          <div class="text-muted small"><i class="bi bi-journal-bookmark me-1"></i>${esc(clase.materiaNombre || 'Materia a definir')}</div>
          <div class="text-muted small"><i class="bi ${clase.modalidad === 'presencial' ? 'bi-geo-alt' : 'bi-camera-video'} me-1"></i>${esc(modalityLabel(clase.modalidad))}</div>
          <div class="text-muted small"><i class="bi bi-cash-coin me-1"></i>${esc(clase.precio != null ? `$${Number(clase.precio).toLocaleString('es-AR')}` : 'Precio a coordinar')}</div>
          ${clase.modalidad === 'presencial' && clase.ubicacion ? `<div class="text-muted small"><i class="bi bi-pin-map me-1"></i>${esc(clase.ubicacion)}</div>` : ''}
        </div>
        <span class="badge rounded-pill text-bg-light border">${esc(formatDate(clase.fecha))}</span>
      </div>
      <p class="text-muted flex-grow-1 mb-4">${esc(clase.descripcion || 'Sin descripción.')}</p>
      <div class="d-flex gap-2 flex-wrap mt-auto">
        <a class="btn btn-outline-dark btn-sm rounded-pill px-3" href="/pages/detalle-clase.html?id=${encodeURIComponent(clase.id)}">Ver detalle</a>
        ${enrollButton}
        ${canManage ? `<a class="btn btn-dark btn-sm rounded-pill px-3" href="/pages/crear-clase.html?id=${encodeURIComponent(clase.id)}">Editar</a>` : ''}
        ${canManage ? `<button class="btn btn-outline-danger btn-sm rounded-pill px-3 delete-clase-btn" data-id="${encodeURIComponent(clase.id)}" type="button">Eliminar</button>` : ''}
      </div>
    </div>
  </div>
</div>`;
      })
      .join('');

    container.innerHTML = `<div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">${cards}</div>`;
  }

  global.MentoriasUI = {
    mountNavbar,
    renderClasesCards,
    formatDate,
  };
})(window);
