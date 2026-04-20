(async function () {
  await MentoriasUI.mountNavbar();

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const err = document.getElementById('detalle-error');
  const panel = document.getElementById('detalle-content');
  const editLink = document.getElementById('dc-edit');
  const user = MentoriasAuth.getUser();

  if (!id) {
    err.classList.remove('d-none');
    err.textContent = 'Falta el parámetro id en la URL.';
    return;
  }

  try {
    const { data } = await MentoriasApi.getClase(id);

    document.getElementById('dc-titulo').textContent = data.titulo;
    document.getElementById('dc-desc').textContent = data.descripcion || 'Sin descripción.';
    document.getElementById('dc-id').textContent = String(data.id);
    document.getElementById('dc-mentor').textContent = `Mentor: ${data.mentorNombre || 'Mentorix'}`;
    document.getElementById('dc-email').textContent = data.mentorEmail || 'No disponible';
    document.getElementById('dc-fecha').textContent = MentoriasUI.formatDate(data.fecha);

    if (user && user.rol === 'mentor' && Number(user.id) === Number(data.mentorId)) {
      editLink.href = `/pages/crear-clase.html?id=${encodeURIComponent(data.id)}`;
      editLink.classList.remove('d-none');
    }

    panel.classList.remove('d-none');
  } catch (error) {
    err.classList.remove('d-none');
    err.textContent = error.message;
  }
})();
