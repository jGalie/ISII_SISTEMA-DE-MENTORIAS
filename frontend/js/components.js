/**
 * Componentes UI ligeros (sin bundler): navbar remoto, footer remoto + tarjetas de clase.
 */
(function (global) {
  const NAVBAR_SELECTOR = '[data-component="navbar"]';
  const FOOTER_SELECTOR = '#footer';

  function rutaComponente(fileName) {
    const fromPages = window.location.pathname.includes('/pages/');
    return `${fromPages ? '../' : ''}components/${fileName}`;
  }

  async function montarNavbar() {
    const host = document.querySelector(NAVBAR_SELECTOR);
    if (!host) return;
    try {
      const res = await fetch(rutaComponente('navbar.html'), { cache: 'no-store' });
      if (!res.ok) throw new Error('No se pudo cargar navbar');
      host.innerHTML = await res.text();
      resaltarEnlaceActivo();
    } catch (e) {
      host.innerHTML = `<p class="alert alert--error" role="alert">${e.message}</p>`;
    }
  }

  async function montarFooter() {
    const host = document.querySelector(FOOTER_SELECTOR);
    if (!host) return;
    try {
      const res = await fetch(rutaComponente('footer.html'), { cache: 'no-store' });
      if (!res.ok) throw new Error('No se pudo cargar footer');
      host.innerHTML = await res.text();
      adjuntarEnlaceClasesFooter(host);
    } catch (e) {
      host.innerHTML = `<p class="alert alert-danger m-0" role="alert">${e.message}</p>`;
    }
  }

  function obtenerUsuarioGuardado() {
    if (global.MentoriasAuth && typeof global.MentoriasAuth.obtenerUsuario === 'function') {
      return global.MentoriasAuth.obtenerUsuario();
    }

    const keys = ['usuarioLogueado'];
    const stores = [global.localStorage, global.sessionStorage].filter(Boolean);

    for (const store of stores) {
      for (const key of keys) {
        try {
          const user = JSON.parse(store.getItem(key) || 'null');
          if (user && user.id && user.email) return user;
        } catch {
          // Ignora valores corruptos sin modificar la sesion del usuario.
        }
      }
    }

    return null;
  }

  function estaAutenticado() {
    if (global.MentoriasAuth && typeof global.MentoriasAuth.estaAutenticado === 'function') {
      return global.MentoriasAuth.estaAutenticado();
    }

    const user = obtenerUsuarioGuardado();
    return Boolean(user && user.id && user.email);
  }

  function adjuntarEnlaceClasesFooter(scope) {
    const link = scope.querySelector('[data-footer-clases]');
    if (!link) return;

    link.addEventListener('click', (event) => {
      event.preventDefault();

      if (estaAutenticado()) {
        global.location.href = '/pages/clases.html';
        return;
      }

      mostrarAvisoAuthClases();
    });
  }

  function mostrarAvisoAuthClases() {
    const existing = document.getElementById('classes-auth-notice');
    if (existing) existing.remove();

    const markup = `
<div class="modal fade" id="classes-auth-notice" tabindex="-1" aria-labelledby="classes-auth-notice-title" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow">
      <div class="modal-header border-0 pb-0">
        <h2 class="modal-title h5 fw-bold" id="classes-auth-notice-title">Acceso a clases</h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>
      <div class="modal-body">
        <p class="mb-0">Para acceder a las clases deb&eacute;s iniciar sesi&oacute;n o registrarte como estudiante o mentor.</p>
      </div>
      <div class="modal-footer border-0 pt-0 justify-content-center justify-content-sm-end">
        <a class="btn btn-outline-dark rounded-pill px-4" href="/pages/login.html">Iniciar sesi&oacute;n</a>
        <a class="btn btn-dark rounded-pill px-4" href="/pages/register.html">Registrarse</a>
      </div>
    </div>
  </div>
</div>`;

    document.body.insertAdjacentHTML('beforeend', markup);
    const notice = document.getElementById('classes-auth-notice');

    if (global.bootstrap && global.bootstrap.Modal) {
      const modal = new global.bootstrap.Modal(notice);
      notice.addEventListener('hidden.bs.modal', () => notice.remove(), { once: true });
      modal.show();
      return;
    }

    notice.classList.add('show');
    notice.style.display = 'block';
    notice.removeAttribute('aria-hidden');
  }

  function resaltarEnlaceActivo() {
    const path = window.location.pathname;
    document.querySelectorAll('.app-nav__links a[data-nav]').forEach((a) => {
      const key = a.getAttribute('data-nav');
      const active =
        (key === 'dashboard' && path.endsWith('/dashboard.html')) ||
        (key === 'clases' && path.endsWith('/clases.html')) ||
        (key === 'crear' && path.endsWith('/crear-clase.html'));
      if (active) a.setAttribute('aria-current', 'page');
    });
  }

  function formatearFecha(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  /**
   * @param {object} c - objeto Clase del backend
   */
  function htmlTarjetaClase(c) {
    const safe = (s) =>
      String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;');
    const titulo = safe(c.titulo);
    const id = Number(c.id);
    const materia = safe(c.materiaNombre || c.materia || `Materia #${c.materiaId ?? '—'}`);
    const fecha = safe(c.fechaLabel || formatearFecha(c.fechaInicio));
    return `
<article class="clase-card">
  <div class="clase-card__top">
    <h3 class="clase-card__title">${titulo}</h3>
    <span class="badge">${safe(c.estado || 'borrador')}</span>
  </div>
  <p class="clase-card__meta">${materia}</p>
  <p class="clase-card__meta">Fecha: <strong>${fecha}</strong></p>
  <div class="clase-card__actions">
    <a class="btn btn--ghost" href="/pages/detalle-clase.html?id=${id}">Ver detalle</a>
  </div>
</article>`;
  }

  function renderizarTarjetasClase(container, clases) {
    if (!container) return;
    if (!clases || !clases.length) {
      container.innerHTML = '<p class="muted">No hay clases todavía. Crea una desde “Nueva clase”.</p>';
      return;
    }
    container.innerHTML = `<div class="grid-cards">${clases.map((c) => htmlTarjetaClase(c)).join('')}</div>`;
  }

  global.MentoriasUi = {
    montarNavbar,
    montarFooter,
    renderizarTarjetasClase,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montarFooter);
  } else {
    montarFooter();
  }
})(window);
