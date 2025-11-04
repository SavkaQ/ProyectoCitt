<<<<<<< HEAD
// Módulo de reservas: catálogo, creación y gestión de estados
=======
// Lógica de reservas remota
>>>>>>> sync-conflicto
window.CIIT = window.CIIT || {};

(function(exports) {
  function init() {
    configurarModalReserva();
    renderizarCatalogos();
    renderizarReservasPendientes();
    renderizarResumenReservas();
    renderizarMisReservas();
  }

  function obtenerDatosBase() {
    return {
      usuario: exports.sesion.obtenerUsuarioActual(),
      inventario: exports.storage.obtenerDatos('inventario'),
      espacios: exports.storage.obtenerDatos('espacios'),
      reservas: exports.storage.obtenerDatos('reservas')
    };
  }

  function configurarModalReserva() {
    const modal = document.querySelector('#modalReserva');
    const cerrar = document.querySelector('#cerrarModalReserva');
    const formulario = document.querySelector('#formReserva');

    if (!modal || !formulario) return;

    cerrar?.addEventListener('click', () => modal.classList.add('oculto'));
    modal.addEventListener('click', (evento) => {
      if (evento.target === modal) modal.classList.add('oculto');
    });

    formulario.addEventListener('submit', manejarEnvioReserva);
  }

  function abrirModalReserva(tipo, referenciaId) {
    const modal = document.querySelector('#modalReserva');
    const formulario = document.querySelector('#formReserva');
    if (!modal || !formulario) return;

    const { inventario, espacios } = obtenerDatosBase();
    const titulo = formulario.querySelector('#tituloReserva');
    const campoReferencia = formulario.querySelector('[name="referenciaId"]');
    const campoTipo = formulario.querySelector('[name="tipo"]');
    const detalle = formulario.querySelector('#detalleReservaSeleccionada');

    let elemento = null;
    if (tipo === 'articulo') {
      elemento = inventario.find((item) => item.id === referenciaId);
    } else {
      elemento = espacios.find((espacio) => espacio.id === referenciaId);
    }

    if (!elemento) return;

    titulo.textContent = `Reserva de ${elemento.nombre}`;
    detalle.textContent = tipo === 'articulo'
      ? `${elemento.categoria} · Stock: ${elemento.stock} · Estado: ${elemento.estado}`
      : `Capacidad: ${elemento.capacidad} · Estado: ${elemento.estado}`;

    campoReferencia.value = referenciaId;
    campoTipo.value = tipo;

    const usuario = exports.sesion.obtenerUsuarioActual();
    formulario.querySelector('[name="nombre"]').value = usuario?.nombre || '';
    formulario.querySelector('[name="rut"]').value = usuario?.rut || '';

    modal.classList.remove('oculto');
  }

  function manejarEnvioReserva(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const mensaje = formulario.querySelector('.mensaje-form');
    const datos = new FormData(formulario);
    const { usuario, inventario, espacios, reservas } = obtenerDatosBase();
    const tipo = datos.get('tipo');
    const referenciaId = datos.get('referenciaId');
    const solicitante = datos.get('nombre').trim();
    const rut = datos.get('rut').trim();

    if (!usuario) {
      exports.validaciones.mostrarMensaje(mensaje, 'error', 'Debes iniciar sesión para reservar.');
      return;
    }

    if (!solicitante || !rut) {
      exports.validaciones.mostrarMensaje(mensaje, 'error', 'Ingresa nombre y RUT para la reserva.');
      return;
    }

    if (!exports.validaciones.esRutValido(rut)) {
      exports.validaciones.mostrarMensaje(mensaje, 'error', 'El RUT ingresado no es válido.');
      return;
    }

    let recursoSeleccionado = null;

    if (tipo === 'articulo') {
      const articulo = inventario.find((item) => item.id === referenciaId);
      if (!articulo) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Artículo no encontrado.');
        return;
      }

      const disponibles = calcularDisponibilidadArticulo(articulo, reservas);
      if (disponibles <= 0) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'No hay unidades disponibles para reservar.');
        return;
      }
      recursoSeleccionado = articulo;
    } else {
      const espacio = espacios.find((item) => item.id === referenciaId);
      if (!espacio) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Espacio no encontrado.');
        return;
      }

      const activas = reservas.filter((reserva) =>
        reserva.tipo === 'espacio' &&
        reserva.referenciaId === referenciaId &&
        ['pendiente', 'aprobada'].includes(reserva.estado)
      );

      if (activas.length >= 1 || espacio.estado === 'danado') {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Espacio no disponible por el momento.');
        return;
      }
      recursoSeleccionado = espacio;
    }

    const registro = {
      id: exports.storage.generarId('res'),
      usuarioId: usuario.id,
      tipo,
      referenciaId,
      nombre: recursoSeleccionado?.nombre || 'Recurso reservado',
      solicitante,
      rut,
      fecha: new Date().toISOString().slice(0, 10),
      estado: 'pendiente',
      recordatorioGenerado: false,
      devolucionNotificada: false
    };

    reservas.push(registro);
    exports.storage.guardarDatos('reservas', reservas);
    exports.validaciones.mostrarMensaje(mensaje, 'exito', 'Reserva registrada y enviada a aprobación.');

    formulario.reset();
    document.querySelector('#modalReserva')?.classList.add('oculto');
    renderizarReservasPendientes();
    renderizarMisReservas();
    renderizarResumenReservas();

    if (exports.notificaciones && typeof exports.notificaciones.notificarNuevaReserva === 'function') {
      exports.notificaciones.notificarNuevaReserva({
        reserva: registro,
        recurso: recursoSeleccionado,
        solicitante: usuario
      });
      exports.notificaciones.generarAlertasInventario?.();
      exports.notificaciones.generarRecordatoriosAutomaticos?.();
    }
  }

  function calcularDisponibilidadArticulo(articulo, reservas) {
    const activas = reservas.filter((reserva) =>
      reserva.tipo === 'articulo' &&
      reserva.referenciaId === articulo.id &&
      ['pendiente', 'aprobada'].includes(reserva.estado)
    ).length;
    return articulo.stock - activas;
  }

  function renderizarCatalogos() {
    renderizarCatalogoArticulos();
    renderizarCatalogoEspacios();
  }

  function renderizarCatalogoArticulos() {
    const contenedor = document.querySelector('#listaArticulos');
    if (!contenedor) return;

    const { inventario, reservas } = obtenerDatosBase();
    contenedor.innerHTML = '';

    inventario.forEach((item) => {
      const disponibles = calcularDisponibilidadArticulo(item, reservas);
      const tarjeta = document.createElement('article');
      tarjeta.className = 'card-item';
      tarjeta.innerHTML = `
        <h4>${item.nombre}</h4>
        <p class="texto-secundario">${item.categoria} · ${item.descripcion || 'Sin descripción'}</p>
        <div class="estado-inventario">
          <span><i class="punto-disponible"></i> Disponibles ${Math.max(disponibles, 0)}</span>
          <span><i class="punto-prestado"></i> Stock ${item.stock}</span>
        </div>
        <footer>
          <span class="etiqueta-estado estado-${item.estado}">${item.estado}</span>
          <button class="btn-accion" data-tipo="articulo" data-id="${item.id}" ${disponibles <= 0 ? 'disabled' : ''}>Reservar</button>
        </footer>
      `;
      contenedor.appendChild(tarjeta);
    });

    contenedor.querySelectorAll('button[data-id]').forEach((boton) => {
      boton.addEventListener('click', () => abrirModalReserva('articulo', boton.dataset.id));
    });
  }

  function renderizarCatalogoEspacios() {
    const contenedor = document.querySelector('#listaEspacios');
    if (!contenedor) return;

    const { espacios, reservas } = obtenerDatosBase();
    contenedor.innerHTML = '';

    espacios.forEach((espacio) => {
      const activas = reservas.filter((reserva) =>
        reserva.tipo === 'espacio' &&
        reserva.referenciaId === espacio.id &&
        ['pendiente', 'aprobada'].includes(reserva.estado)
      ).length;

      const disponible = activas === 0 && espacio.estado !== 'danado';

      const tarjeta = document.createElement('article');
      tarjeta.className = 'card-item';
      tarjeta.innerHTML = `
        <h4>${espacio.nombre}</h4>
        <p class="texto-secundario">Capacidad ${espacio.capacidad} personas</p>
        <ul class="lista-simple">
          ${espacio.recursos.map((recurso) => `<li>${recurso}</li>`).join('')}
        </ul>
        <footer>
          <span class="etiqueta-estado estado-${espacio.estado}">${espacio.estado}</span>
          <button class="btn-accion" data-tipo="espacio" data-id="${espacio.id}" ${!disponible ? 'disabled' : ''}>Reservar</button>
        </footer>
      `;

      contenedor.appendChild(tarjeta);
    });

    contenedor.querySelectorAll('button[data-id]').forEach((boton) => {
      boton.addEventListener('click', () => abrirModalReserva('espacio', boton.dataset.id));
    });
  }

  function renderizarMisReservas() {
    const tabla = document.querySelector('#cuerpoMisReservas');
    if (!tabla) return;

    const { usuario, reservas } = obtenerDatosBase();
    tabla.innerHTML = '';

    const propias = usuario
      ? reservas.filter((reserva) => reserva.usuarioId === usuario.id)
      : [];

    if (propias.length === 0) {
      const fila = document.createElement('tr');
      fila.innerHTML = '<td colspan="4">No se registran reservas para tu usuario.</td>';
      tabla.appendChild(fila);
      return;
    }

    propias.forEach((reserva) => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${reserva.nombre}</td>
        <td>${reserva.tipo}</td>
        <td>${reserva.fecha}</td>
        <td><span class="badge ${reserva.estado === 'aprobada' ? 'badge-aprobada' : reserva.estado === 'rechazada' ? 'badge-rechazada' : ''}">${reserva.estado}</span></td>
      `;
      tabla.appendChild(fila);
    });
  }

  function renderizarReservasPendientes() {
    const tabla = document.querySelector('#cuerpoReservasPendientes');
    if (!tabla) return;

    const { usuario, reservas } = obtenerDatosBase();
    if (!usuario || !['coordinador', 'administrador'].includes(usuario.rol)) {
      const tablaCompleta = tabla.closest('table');
      if (tablaCompleta) {
        tablaCompleta.style.display = 'none';
      }
      return;
    }

    tabla.innerHTML = '';
    const pendientes = reservas.filter((reserva) => reserva.estado === 'pendiente');

    if (pendientes.length === 0) {
      const fila = document.createElement('tr');
      fila.innerHTML = '<td colspan="6">No hay reservas pendientes.</td>';
      tabla.appendChild(fila);
      return;
    }

    pendientes.forEach((reserva) => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${reserva.nombre}</td>
        <td>${reserva.tipo}</td>
        <td>${reserva.fecha}</td>
        <td>${reserva.solicitante || 'Sin nombre'}</td>
        <td>${reserva.rut}</td>
        <td class="tabla-acciones">
          <button class="btn-accion btn-pequeno" data-accion="aprobar" data-id="${reserva.id}">Aprobar</button>
          <button class="btn-secundario btn-pequeno" data-accion="rechazar" data-id="${reserva.id}">Rechazar</button>
        </td>
      `;
      tabla.appendChild(fila);
    });

    tabla.querySelectorAll('button[data-accion]').forEach((boton) => {
      boton.addEventListener('click', manejarAccionReserva);
    });
  }

  function manejarAccionReserva(evento) {
    const boton = evento.currentTarget;
    const accion = boton.dataset.accion;
    const id = boton.dataset.id;

    const reservas = exports.storage.obtenerDatos('reservas');
    const indice = reservas.findIndex((reserva) => reserva.id === id);
    if (indice === -1) return;

    const reservaActualizada = reservas[indice];
    const nuevoEstado = accion === 'aprobar' ? 'aprobada' : 'rechazada';
    reservaActualizada.estado = nuevoEstado;
    reservaActualizada.fechaActualizacion = new Date().toISOString();
    if (nuevoEstado !== 'pendiente') {
      reservaActualizada.recordatorioGenerado = false;
    }
    if (nuevoEstado !== 'aprobada') {
      reservaActualizada.devolucionNotificada = false;
    }

    exports.storage.guardarDatos('reservas', reservas);
    renderizarReservasPendientes();
    renderizarMisReservas();
    renderizarResumenReservas();

    if (exports.notificaciones && typeof exports.notificaciones.notificarCambioEstadoReserva === 'function') {
      const recurso = reservaActualizada.tipo === 'articulo'
        ? exports.storage.obtenerDatos('inventario').find((item) => item.id === reservaActualizada.referenciaId)
        : exports.storage.obtenerDatos('espacios').find((item) => item.id === reservaActualizada.referenciaId);
      const aprobador = exports.sesion?.obtenerUsuarioActual?.();
      exports.notificaciones.notificarCambioEstadoReserva({
        reserva: reservaActualizada,
        recurso,
        accion,
        aprobador
      });
      exports.notificaciones.generarRecordatoriosAutomaticos?.();
      exports.notificaciones.renderizar?.();
    }
  }

  function renderizarResumenReservas() {
    const contenedor = document.querySelector('#resumenReservas');
    if (!contenedor) return;

    const reservas = exports.storage.obtenerDatos('reservas');
    const resumen = reservas.reduce((acc, reserva) => {
      acc[reserva.estado] = (acc[reserva.estado] || 0) + 1;
      return acc;
    }, {});

    contenedor.innerHTML = `
      <div class="estado-inventario">
        <span><i class="punto-prestado"></i> Pendientes: ${resumen.pendiente || 0}</span>
        <span><i class="punto-disponible"></i> Aprobadas: ${resumen.aprobada || 0}</span>
        <span><i class="punto-danado"></i> Rechazadas: ${resumen.rechazada || 0}</span>
      </div>
    `;
  }

  exports.reservas = {
    init,
    renderizarCatalogos,
    renderizarReservasPendientes,
    renderizarResumenReservas,
    renderizarMisReservas
  };

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})(window.CIIT);
