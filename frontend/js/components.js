/**
 * Componentes UI ligeros (sin bundler): navbar remoto + tarjetas de clase.
 */
(function (global) {
  const NAVBAR_SELECTOR = '[data-component="navbar"]';

  async function mountNavbar() {
    const host = document.querySelector(NAVBAR_SELECTOR);
    if (!host) return;
    try {
      const res = await fetch('/components/navbar.html', { cache: 'no-store' });
      if (!res.ok) throw new Error('No se pudo cargar navbar');
      host.innerHTML = await res.text();
      highlightActiveLink();
    } catch (e) {
      host.innerHTML = `<p class="alert alert--error" role="alert">${e.message}</p>`;
    }
  }

  function highlightActiveLink() {
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

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  /**
   * @param {object} c - objeto Clase del backend
   */
  function claseCardHtml(c) {
    const safe = (s) =>
      String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;');
    const titulo = safe(c.titulo);
    const id = Number(c.id);
    const materia = safe(c.materiaNombre || c.materia || `Materia #${c.materiaId ?? '—'}`);
    const fecha = safe(c.fechaLabel || formatDate(c.fechaInicio));
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

  function renderClaseCards(container, clases) {
    if (!container) return;
    if (!clases || !clases.length) {
      container.innerHTML = '<p class="muted">No hay clases todavía. Crea una desde “Nueva clase”.</p>';
      return;
    }
    container.innerHTML = `<div class="grid-cards">${clases.map((c) => claseCardHtml(c)).join('')}</div>`;
  }

  global.MentoriasUi = {
    mountNavbar,
    renderClaseCards,
  };
})(window);
