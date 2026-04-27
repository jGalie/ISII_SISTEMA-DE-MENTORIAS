(async function () {
  /**
   * Pantalla de alta y edicion de clases.
   *
   * Desde la capa de interfaz, este modulo recopila los datos ingresados por
   * el mentor, realiza validaciones preventivas y delega la persistencia a la
   * API. Las reglas de negocio definitivas permanecen en el backend, para
   * conservar la separacion de responsabilidades propia de una arquitectura en
   * capas.
   */
  if (!MentoriasAuth.requireAuth()) return;
  await MentoriasUI.mountNavbar();

  // La publicacion de clases pertenece al rol mentor; por eso se bloquea el
  // acceso temprano a otros perfiles antes de habilitar el formulario.
  const usuario = MentoriasAuth.getUser();
  if (!usuario || usuario.rol !== 'mentor') {
    window.location.href = '/index.html';
    return;
  }

  const parametros = new URLSearchParams(window.location.search);
  const idClase = parametros.get('id');
  const esEdicion = Boolean(idClase);
  const rutaVolverMentor = '/pages/dashboard.html';

  const formulario = document.getElementById('form-clase');
  const mensaje = document.getElementById('form-msg');
  const botonGuardar = document.getElementById('btn-guardar');
  const botonEliminar = document.getElementById('btn-delete');
  const tituloPagina = document.getElementById('page-title');
  const selectorMateria = document.getElementById('materia');
  const ayudaMateria = document.getElementById('materia-help');
  const selectorModalidad = document.getElementById('modalidad');
  const inputPrecio = document.getElementById('precio');
  const inputCupoMaximo = document.getElementById('cupo-maximo');
  const contenedorUbicacion = document.getElementById('ubicacion-wrapper');
  const inputUbicacion = document.getElementById('ubicacion');
  let formDirty = false;
  let allowNavigation = false;

  /**
   * Centraliza los mensajes del formulario para comunicar errores, avances y
   * confirmaciones sin duplicar manipulacion directa del DOM.
   */
  function mostrarMensaje(tipo, texto) {
    mensaje.className = `alert alert-${tipo}`;
    mensaje.textContent = texto;
    mensaje.classList.remove('d-none');
  }

  function setFieldError(input, message) {
    if (!input) return;
    const errorBox = document.getElementById(`${input.id}-error`);
    input.classList.add('is-invalid');
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.classList.remove('d-none');
    }
  }

  function clearFieldError(input) {
    if (!input) return;
    const errorBox = document.getElementById(`${input.id}-error`);
    input.classList.remove('is-invalid');
    if (errorBox) errorBox.classList.add('d-none');
  }

  function clearValidationErrors() {
    ['materia', 'titulo', 'descripcion', 'fecha', 'precio', 'cupo-maximo', 'ubicacion'].forEach((id) => {
      clearFieldError(document.getElementById(id));
    });
  }

  function confirmLeave() {
    if (!formDirty) return Promise.resolve(true);
    return MentoriasUI.showConfirmDialog({
      title: 'Cambios sin guardar',
      message: 'Tenes cambios sin guardar. Queres salir sin guardar?',
      confirmText: 'Salir sin guardar',
      cancelText: 'Seguir editando',
    });
  }

  function validateClassForm() {
    clearValidationErrors();
    let ok = true;

    const titulo = document.getElementById('titulo');
    const descripcion = document.getElementById('descripcion');
    const fecha = document.getElementById('fecha');
    const precioValue = Number(inputPrecio.value);
    const cupoValue = Number(inputCupoMaximo.value);
    const modalidad = selectorModalidad.value;
    const ubicacion = inputUbicacion.value.trim();

    if (!selectorMateria.value) {
      setFieldError(selectorMateria, 'Selecciona una materia.');
      ok = false;
    }
    if (!titulo.value.trim()) {
      setFieldError(titulo, 'Ingresa un titulo para la clase.');
      ok = false;
    }
    if (!descripcion.value.trim()) {
      setFieldError(descripcion, 'Ingresa una descripcion.');
      ok = false;
    }
    if (!fecha.value || Number.isNaN(new Date(fecha.value).getTime())) {
      setFieldError(fecha, 'Ingresa una fecha y hora validas.');
      ok = false;
    }
    if (!Number.isFinite(precioValue) || precioValue < 0) {
      setFieldError(inputPrecio, 'Ingresa un precio valido.');
      ok = false;
    }
    if (!Number.isInteger(cupoValue) || cupoValue < 1) {
      setFieldError(inputCupoMaximo, 'Ingresa un cupo valido.');
      ok = false;
    }
    if (modalidad === 'presencial' && !ubicacion) {
      setFieldError(inputUbicacion, 'Ingresa una ubicacion para clases presenciales.');
      ok = false;
    }

    if (!ok) mostrarMensaje('danger', 'Debes completar correctamente los campos marcados.');
    return ok;
  }

  /**
   * Activa o desactiva los campos cuando no existen materias disponibles para
   * el mentor. Esta restriccion mejora la experiencia y anticipa una regla que
   * tambien sera validada por la capa de servicios.
   */
  function alternarDisponibilidadFormulario(habilitado) {
    Array.from(formulario.elements).forEach((element) => {
      if (element === botonEliminar) return;
      element.disabled = !habilitado;
    });
  }

  /**
   * Sincroniza el campo ubicacion con la modalidad seleccionada. En el dominio
   * del sistema, una clase presencial requiere lugar fisico y una virtual no.
   */
  function sincronizarCampoUbicacion() {
    const esPresencial = selectorModalidad && selectorModalidad.value === 'presencial';
    contenedorUbicacion?.classList.toggle('d-none', !esPresencial);
    if (inputUbicacion) {
      inputUbicacion.required = esPresencial;
      if (!esPresencial) {
        inputUbicacion.value = '';
      }
    }
  }

  /**
   * Renderiza las materias asociadas al mentor autenticado. No se muestran
   * materias ajenas para evitar que la interfaz permita combinaciones no
   * validas desde el punto de vista academico y funcional.
   */
  function renderizarMaterias(items, idSeleccionado) {
    if (!selectorMateria) return;

    if (!items.length) {
      selectorMateria.innerHTML = '<option value="">No tienes materias registradas</option>';
      alternarDisponibilidadFormulario(false);
      if (ayudaMateria) {
        ayudaMateria.textContent = 'Primero debes registrarte como mentor con al menos una materia.';
      }
      return;
    }

    selectorMateria.innerHTML = items
      .map((item) => `<option value="${item.materiaId || item.id}" ${Number(idSeleccionado) === Number(item.materiaId || item.id) ? 'selected' : ''}>${item.materiaNombre || item.nombre}</option>`)
      .join('');

    alternarDisponibilidadFormulario(true);
  }

  let materiasMentor = [];
  let claseActual = null;

  try {
    // La carga inicial obtiene las materias del mentor y, si corresponde,
    // tambien recupera la clase existente para completar el formulario.
    const respuestaMaterias = await MentoriasApi.getMentorMaterias(usuario.id);
    materiasMentor = Array.isArray(respuestaMaterias.data) ? respuestaMaterias.data : [];

    if (esEdicion) {
      // En edicion se verifica la autoria antes de permitir modificar datos,
      // manteniendo coherencia con la validacion posterior del backend.
      tituloPagina.textContent = 'Editar clase';
      botonGuardar.textContent = 'Guardar cambios';
      botonEliminar.classList.remove('d-none');

      const { data: datosClase } = await MentoriasApi.obtenerClase(idClase);
      if (Number(datosClase.mentorId) !== Number(usuario.id)) {
        window.location.href = '/pages/clases.html';
        return;
      }

      claseActual = datosClase;
      document.getElementById('titulo').value = datosClase.titulo || '';
      document.getElementById('descripcion').value = datosClase.descripcion || '';
      document.getElementById('modalidad').value = datosClase.modalidad || 'virtual';
      document.getElementById('precio').value = datosClase.precio != null ? datosClase.precio : '';
      document.getElementById('cupo-maximo').value = datosClase.cupoMaximo || 1;
      document.getElementById('ubicacion').value = datosClase.ubicacion || '';
      if (datosClase.fecha) {
        const fechaClase = new Date(datosClase.fecha);
        const diferenciaHoraria = fechaClase.getTimezoneOffset();
        const fechaLocal = new Date(fechaClase.getTime() - diferenciaHoraria * 60000).toISOString().slice(0, 16);
        document.getElementById('fecha').value = fechaLocal;
      }
    }

    renderizarMaterias(materiasMentor, claseActual?.materiaId);
    sincronizarCampoUbicacion();
  } catch (error) {
    mostrarMensaje('danger', error.message);
    alternarDisponibilidadFormulario(false);
    return;
  }

  if (!inputCupoMaximo.value) {
    inputCupoMaximo.value = '1';
  }

  if (selectorModalidad) {
    selectorModalidad.addEventListener('change', sincronizarCampoUbicacion);
  }

  formulario.addEventListener('input', () => {
    formDirty = true;
  });
  formulario.addEventListener('change', () => {
    formDirty = true;
  });

  window.addEventListener('beforeunload', (event) => {
    if (!formDirty || allowNavigation) return;
    event.preventDefault();
    event.returnValue = '';
  });

  document.addEventListener('click', async (event) => {
    const link = event.target.closest('a[href]');
    if (!link || allowNavigation) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#') || link.target === '_blank') return;
    if (link.hasAttribute('data-back-link')) {
      event.preventDefault();
      if (!formDirty || (await confirmLeave())) {
        allowNavigation = true;
        MentoriasUI.goBackOrHome(href);
      }
      return;
    }
    if (!formDirty) return;
    event.preventDefault();
    if (await confirmLeave()) {
      allowNavigation = true;
      window.location.href = href;
    }
  });

  /**
   * Construye el objeto de clase que viaja hacia la API. Las validaciones de
   * esta pantalla son inmediatas, pero no reemplazan las comprobaciones del
   * service, que es la autoridad de negocio en el backend.
   */
  formulario.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!validateClassForm()) return;

    const valorFecha = document.getElementById('fecha').value;
    if (!valorFecha) {
      mostrarMensaje('danger', 'Debes indicar una fecha valida.');
      return;
    }

    const precio = Number(inputPrecio.value);
    const cupoMaximo = Number(inputCupoMaximo.value);
    const modalidad = document.getElementById('modalidad').value;
    const ubicacion = inputUbicacion.value.trim();

    if (!Number.isFinite(precio) || precio < 0) {
      mostrarMensaje('danger', 'Debes ingresar un precio valido.');
      return;
    }
    if (!Number.isInteger(cupoMaximo) || cupoMaximo < 1) {
      mostrarMensaje('danger', 'Debes ingresar un cupo valido.');
      return;
    }

    if (modalidad === 'presencial' && !ubicacion) {
      mostrarMensaje('danger', 'Debes ingresar una ubicacion para una clase presencial.');
      return;
    }

    const datosClase = {
      titulo: document.getElementById('titulo').value,
      descripcion: document.getElementById('descripcion').value,
      fecha: new Date(valorFecha).toISOString().slice(0, 19).replace('T', ' '),
      modalidad,
      materiaId: Number(selectorMateria.value),
      precio,
      cupoMaximo,
      ubicacion: modalidad === 'presencial' ? ubicacion : null,
      mentorId: usuario.id,
    };

    try {
      botonGuardar.disabled = true;
      mostrarMensaje('info', esEdicion ? 'Guardando cambios...' : 'Creando clase...');

      if (esEdicion) {
        await MentoriasApi.actualizarClase(idClase, datosClase);
      } else {
        await MentoriasApi.crearClase(datosClase);
      }

      formDirty = false;
      allowNavigation = true;
      mostrarMensaje('success', esEdicion ? 'Clase actualizada correctamente.' : 'Clase creada correctamente.');
      setTimeout(() => {
        window.location.href = rutaVolverMentor;
      }, 600);
    } catch (error) {
      mostrarMensaje('danger', error.message);
    } finally {
      botonGuardar.disabled = false;
    }
  });

  if (botonEliminar) {
    // La eliminacion se expone solamente en modo edicion y envia el mentorId
    // para que el backend pueda corroborar la propiedad de la clase.
    botonEliminar.addEventListener('click', async function () {
      if (!esEdicion) return;
      const confirmarEliminacion = await MentoriasUI.showConfirmDialog({
        title: 'Eliminar clase',
        message: 'Esta accion no se puede deshacer. Queres eliminar la clase?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        tone: 'danger',
      });
      if (!confirmarEliminacion) return;

      try {
        botonEliminar.disabled = true;
        mostrarMensaje('warning', 'Eliminando clase...');
        await MentoriasApi.eliminarClase(idClase, { mentorId: usuario.id });
        formDirty = false;
        allowNavigation = true;
        mostrarMensaje('success', 'Clase eliminada.');
        setTimeout(() => {
          window.location.href = '/pages/clases.html';
        }, 600);
      } catch (error) {
        mostrarMensaje('danger', error.message);
        botonEliminar.disabled = false;
      }
    });
  }
})();
