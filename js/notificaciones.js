// Módulo de notificaciones: generación, persistencia y renderizado dinámico
window.CIIT = window.CIIT || {};

(function(exports) {
  const TIPOS_VALIDOS = new Set(['confirmacion', 'aprobacion', 'rechazo', 'recordatorio', 'alerta']);
  const ETIQUETAS_TIPO = {
    confirmacion: 'Confirmación',
    aprobacion: 'Aprobación',
    rechazo: 'Rechazo',
    recordatorio: 'Recordatorio',
    alerta: 'Alerta'
  };

  function init() {
    generarRecordatoriosAutomaticos();
    generarAlertasInventario();
    renderizarNotificaciones();
    inicializarEventos();
  }

  function inicializarEventos() {
    const botonMarcarTodas = document.querySelector('#btnMarcarNotificaciones');
    if (botonMarcarTodas && !botonMarcarTodas.dataset.listener) {
      botonMarcarTodas.addEventListener('click', (evento) => {
        evento.preventDefault();
        marcarTodasComoLeidas();
      });
      botonMarcarTodas.dataset.listener = 'true';
    }
  }

  function obtenerTodas() {
    const lista = exports.storage?.obtenerDatos('notificaciones');
    return Array.isArray(lista) ? lista : [];
  }

  function guardarTodas(lista) {
    exports.storage?.guardarDatos('notificaciones', lista);
  }

  function normalizarDestinatarios(destinatarios = {}) {
    return {
      global: Boolean(destinatarios.global),
      roles: Array.isArray(destinatarios.roles)
        ? destinatarios.roles.filter(Boolean)
        : (typeof destinatarios.roles === 'string' ? [destinatarios.roles] : []),
      usuarios: Array.isArray(destinatarios.usuarios)
        ? destinatarios.usuarios.filter(Boolean)
        : (typeof destinatarios.usuarios === 'string' ? [destinatarios.usuarios] : [])
    };
  }

  function referenciasCoinciden(a, b) {
    if (!a || !b) return false;
    return a.id === b.id && a.tipo === b.tipo;
  }

  function crearNotificacion(opciones = {}) {
    const {
      tipo,
      titulo,
      descripcion,
      destinatarios,
      referencia,
      importancia = 'media',
      categoria = null,
      unica = false
    } = opciones;

    if (!TIPOS_VALIDOS.has(tipo) || !titulo || !descripcion) return false;

    const notificaciones = obtenerTodas();
    const referenciaNormalizada = referencia || null;

    if (unica && referenciaNormalizada) {
      const yaExiste = notificaciones.some((notificacion) =>
        notificacion.tipo === tipo &&
        !notificacion.archivada &&
        (!categoria || notificacion.categoria === categoria) &&
        referenciasCoinciden(notificacion.referencia, referenciaNormalizada)
      );
      if (yaExiste) {
        return false;
      }
    }

    const registro = {
      id: exports.storage.generarId('not'),
      tipo,
      titulo,
      descripcion,
      fecha: new Date().toISOString(),
      destinatarios: normalizarDestinatarios(destinatarios),
      referencia: referenciaNormalizada,
      importancia,
      categoria,
      leidoPor: [],
      archivada: false
    };

    notificaciones.push(registro);
    guardarTodas(notificaciones);
    renderizarNotificaciones();
    return true;
  }

  function resolverPorReferencia(tipo, referencia, categoria = null) {
    if (!referencia) return false;
    const notificaciones = obtenerTodas();
    let actualizado = false;

    notificaciones.forEach((notificacion) => {
      if (
        notificacion.tipo === tipo &&
        !notificacion.archivada &&
        referenciasCoinciden(notificacion.referencia, referencia) &&
        (categoria === null || notificacion.categoria === categoria)
      ) {
        notificacion.archivada = true;
        actualizado = true;
      }
    });

    if (actualizado) {
      guardarTodas(notificaciones);
      renderizarNotificaciones();
    }

    return actualizado;
  }

  function filtrarParaUsuario(lista, usuario) {
    return lista.filter((notificacion) => !notificacion.archivada && aplicaParaUsuario(notificacion, usuario));
  }

  function aplicaParaUsuario(notificacion, usuario) {
    const destino = normalizarDestinatarios(notificacion.destinatarios);
    if (destino.global) return true;
    if (!usuario) return false;
    const leidos = Array.isArray(notificacion.leidoPor) ? notificacion.leidoPor : [];
    notificacion.leidoPor = leidos;
    return destino.usuarios.includes(usuario.id) || destino.roles.includes(usuario.rol);
  }

  function renderizarNotificaciones() {
    const contenedor = document.querySelector('#listaNotificaciones');
    const contador = document.querySelector('#contadorNotificaciones');
    const usuario = exports.sesion?.obtenerUsuarioActual?.();
    const todas = obtenerTodas();
    const visibles = filtrarParaUsuario(todas, usuario)
      .slice()
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    if (contenedor) {
      contenedor.innerHTML = '';
      if (visibles.length === 0) {
        const vacio = document.createElement('li');
        vacio.className = 'texto-secundario';
        vacio.textContent = 'No tienes notificaciones pendientes.';
        contenedor.appendChild(vacio);
      } else {
        visibles.forEach((notificacion) => {
          contenedor.appendChild(crearElementoNotificacion(notificacion, usuario));
        });
      }
    }

    if (contador) {
      const noLeidas = usuario
        ? visibles.filter((notificacion) => !notificacion.leidoPor?.includes(usuario.id)).length
        : 0;
      contador.textContent = noLeidas;
      contador.classList.toggle('oculto', noLeidas === 0);
    }
  }

  function crearElementoNotificacion(notificacion, usuario) {
    const item = document.createElement('li');
    const tipo = notificacion.tipo || 'general';
    const clases = ['notificacion', `notificacion-${tipo}`];
    if (usuario && notificacion.leidoPor?.includes(usuario.id)) {
      clases.push('notificacion-leida');
    }
    item.className = clases.join(' ');

    const cabecera = document.createElement('div');
    cabecera.className = 'notificacion-header';

    const etiquetaTipo = document.createElement('span');
    etiquetaTipo.className = 'notificacion-tipo';
    etiquetaTipo.textContent = ETIQUETAS_TIPO[tipo] || 'Notificación';
    cabecera.appendChild(etiquetaTipo);

    const fecha = document.createElement('span');
    fecha.className = 'notificacion-fecha';
    fecha.textContent = formatearFecha(notificacion.fecha);
    cabecera.appendChild(fecha);

    item.appendChild(cabecera);

    const titulo = document.createElement('h4');
    titulo.textContent = notificacion.titulo;
    item.appendChild(titulo);

    const descripcion = document.createElement('p');
    descripcion.textContent = notificacion.descripcion;
    item.appendChild(descripcion);

    const pie = document.createElement('div');
    pie.className = 'notificacion-acciones';

    if (notificacion.categoria) {
      const badgeCategoria = document.createElement('span');
      badgeCategoria.className = 'badge';
      badgeCategoria.textContent = obtenerEtiquetaCategoria(notificacion.categoria);
      pie.appendChild(badgeCategoria);
    }

    if (usuario && !notificacion.leidoPor?.includes(usuario.id)) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'btn-secundario btn-pequeno';
      boton.textContent = 'Marcar como leída';
      boton.addEventListener('click', () => marcarComoLeida(notificacion.id));
      pie.appendChild(boton);
    }

    item.appendChild(pie);

    return item;
  }

  function obtenerEtiquetaCategoria(categoria) {
    switch (categoria) {
      case 'pendiente':
        return 'Reservas pendientes';
      case 'devolucion':
        return 'Devoluciones';
      case 'agotado':
        return 'Inventario';
      case 'estado':
        return 'Estado de reserva';
      default:
        return 'General';
    }
  }

  function formatearFecha(fechaIso) {
    const fecha = fechaIso ? new Date(fechaIso) : null;
    if (!fecha || Number.isNaN(fecha.getTime())) return '';
    try {
      return new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(fecha);
    } catch (error) {
      return fecha.toLocaleString();
    }
  }

  function marcarComoLeida(id) {
    const usuario = exports.sesion?.obtenerUsuarioActual?.();
    if (!usuario) return;

    const notificaciones = obtenerTodas();
    const indice = notificaciones.findIndex((notificacion) => notificacion.id === id);
    if (indice === -1) return;

    const leidoPor = Array.isArray(notificaciones[indice].leidoPor) ? notificaciones[indice].leidoPor : [];
    if (!leidoPor.includes(usuario.id)) {
      leidoPor.push(usuario.id);
      notificaciones[indice].leidoPor = leidoPor;
      guardarTodas(notificaciones);
      renderizarNotificaciones();
    }
  }

  function marcarTodasComoLeidas() {
    const usuario = exports.sesion?.obtenerUsuarioActual?.();
    if (!usuario) return;

    const notificaciones = obtenerTodas();
    let actualizado = false;

    notificaciones.forEach((notificacion) => {
      if (aplicaParaUsuario(notificacion, usuario)) {
        const leidoPor = Array.isArray(notificacion.leidoPor) ? notificacion.leidoPor : [];
        if (!leidoPor.includes(usuario.id)) {
          leidoPor.push(usuario.id);
          notificacion.leidoPor = leidoPor;
          actualizado = true;
        }
      }
    });

    if (actualizado) {
      guardarTodas(notificaciones);
      renderizarNotificaciones();
    }
  }

  function calcularDiasDesde(fechaIso, fechaComparacion = new Date()) {
    const fecha = fechaIso ? new Date(fechaIso) : null;
    if (!fecha || Number.isNaN(fecha.getTime())) return 0;
    const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const fin = new Date(fechaComparacion.getFullYear(), fechaComparacion.getMonth(), fechaComparacion.getDate());
    const diferencia = fin.getTime() - inicio.getTime();
    return Math.max(0, Math.floor(diferencia / (1000 * 60 * 60 * 24)));
  }

  function obtenerNombreRecurso(reserva) {
    if (reserva?.nombre) return reserva.nombre;
    const clave = reserva?.tipo === 'articulo' ? 'inventario' : 'espacios';
    const lista = exports.storage?.obtenerDatos(clave) || [];
    const recurso = lista.find((elemento) => elemento.id === reserva?.referenciaId);
    return recurso?.nombre || 'Recurso solicitado';
  }

  function generarRecordatoriosAutomaticos() {
    const reservas = exports.storage?.obtenerDatos('reservas');
    if (!Array.isArray(reservas)) return;

    const hoy = new Date();
    let seActualizo = false;

    reservas.forEach((reserva) => {
      const nombreRecurso = obtenerNombreRecurso(reserva);
      const solicitante = reserva.solicitante || 'Un usuario';

      if (reserva.estado === 'pendiente') {
        const diasPendiente = calcularDiasDesde(reserva.fecha, hoy);
        if (diasPendiente >= 2 && !reserva.recordatorioGenerado) {
          crearNotificacion({
            tipo: 'recordatorio',
            titulo: 'Reserva pendiente por aprobar',
            descripcion: `${solicitante} solicitó ${nombreRecurso} hace ${diasPendiente} día${diasPendiente === 1 ? '' : 's'}.`,
            destinatarios: { roles: ['coordinador', 'administrador'] },
            referencia: { tipo: 'reserva', id: reserva.id },
            importancia: 'alta',
            categoria: 'pendiente',
            unica: true
          });
          reserva.recordatorioGenerado = true;
          seActualizo = true;
        }
      } else if (reserva.recordatorioGenerado) {
        reserva.recordatorioGenerado = false;
        seActualizo = true;
      }

      if (reserva.estado === 'aprobada') {
        const diasAprobada = calcularDiasDesde(reserva.fecha, hoy);
        if (diasAprobada >= 5 && !reserva.devolucionNotificada) {
          crearNotificacion({
            tipo: 'recordatorio',
            titulo: 'Recordatorio de devolución',
            descripcion: `Verifica la devolución de ${nombreRecurso} reservado por ${solicitante} hace ${diasAprobada} día${diasAprobada === 1 ? '' : 's'}.`,
            destinatarios: { roles: ['coordinador', 'administrador'], usuarios: [reserva.usuarioId] },
            referencia: { tipo: 'reserva', id: reserva.id },
            importancia: 'alta',
            categoria: 'devolucion',
            unica: true
          });
          reserva.devolucionNotificada = true;
          seActualizo = true;
        }
      } else if (reserva.devolucionNotificada) {
        reserva.devolucionNotificada = false;
        seActualizo = true;
      }

      if (reserva.estado !== 'pendiente') {
        resolverPorReferencia('recordatorio', { tipo: 'reserva', id: reserva.id }, 'pendiente');
      }

      if (reserva.estado !== 'aprobada') {
        resolverPorReferencia('recordatorio', { tipo: 'reserva', id: reserva.id }, 'devolucion');
      }
    });

    if (seActualizo) {
      exports.storage?.guardarDatos('reservas', reservas);
    }
  }

  function generarAlertasInventario() {
    const inventario = exports.storage?.obtenerDatos('inventario');
    const reservas = exports.storage?.obtenerDatos('reservas');
    if (!Array.isArray(inventario) || !Array.isArray(reservas)) return;

    inventario.forEach((articulo) => {
      const activas = reservas.filter((reserva) =>
        reserva.tipo === 'articulo' &&
        reserva.referenciaId === articulo.id &&
        ['pendiente', 'aprobada'].includes(reserva.estado)
      );

      const disponibles = articulo.stock - activas.length;
      const referencia = { tipo: 'articulo', id: articulo.id };

      if (disponibles <= 0) {
        crearNotificacion({
          tipo: 'alerta',
          titulo: `Sin stock · ${articulo.nombre}`,
          descripcion: `El artículo ${articulo.nombre} no tiene unidades disponibles. Revisa devoluciones o actualiza el stock.`,
          destinatarios: { roles: ['coordinador', 'administrador'] },
          referencia,
          importancia: 'alta',
          categoria: 'agotado',
          unica: true
        });
      } else {
        resolverPorReferencia('alerta', referencia, 'agotado');
      }
    });
  }

  function notificarNuevaReserva({ reserva, recurso, solicitante }) {
    if (!reserva) return;
    const nombreRecurso = recurso?.nombre || obtenerNombreRecurso(reserva);
    const nombreSolicitante = reserva.solicitante || solicitante?.nombre || 'Un usuario';

    crearNotificacion({
      tipo: 'confirmacion',
      titulo: 'Reserva registrada',
      descripcion: `Tu reserva de ${nombreRecurso} fue enviada y espera aprobación del coordinador.`,
      destinatarios: { usuarios: [reserva.usuarioId] },
      referencia: { tipo: 'reserva', id: reserva.id },
      importancia: 'media',
      categoria: 'estado',
      unica: true
    });

    crearNotificacion({
      tipo: 'recordatorio',
      titulo: 'Nueva reserva pendiente',
      descripcion: `${nombreSolicitante} solicitó ${nombreRecurso}. Revisa la solicitud para confirmarla.`,
      destinatarios: { roles: ['coordinador', 'administrador'] },
      referencia: { tipo: 'reserva', id: reserva.id },
      importancia: 'media',
      categoria: 'pendiente',
      unica: true
    });
  }

  function notificarCambioEstadoReserva({ reserva, recurso, accion, aprobador }) {
    if (!reserva) return;
    const nombreRecurso = recurso?.nombre || obtenerNombreRecurso(reserva);
    const nombreAprobador = aprobador?.nombre ? ` por ${aprobador.nombre}` : '';

    if (accion === 'aprobar') {
      crearNotificacion({
        tipo: 'aprobacion',
        titulo: 'Reserva aprobada',
        descripcion: `Tu reserva de ${nombreRecurso} fue aprobada${nombreAprobador}. Coordina el retiro según las indicaciones.`,
        destinatarios: { usuarios: [reserva.usuarioId] },
        referencia: { tipo: 'reserva', id: reserva.id },
        importancia: 'alta',
        categoria: 'estado',
        unica: true
      });
      resolverPorReferencia('recordatorio', { tipo: 'reserva', id: reserva.id }, 'pendiente');
    } else {
      crearNotificacion({
        tipo: 'rechazo',
        titulo: 'Reserva rechazada',
        descripcion: `La reserva de ${nombreRecurso} fue rechazada${nombreAprobador}. Revisa las observaciones con el coordinador.`,
        destinatarios: { usuarios: [reserva.usuarioId] },
        referencia: { tipo: 'reserva', id: reserva.id },
        importancia: 'media',
        categoria: 'estado',
        unica: true
      });
      resolverPorReferencia('recordatorio', { tipo: 'reserva', id: reserva.id }, 'pendiente');
      resolverPorReferencia('recordatorio', { tipo: 'reserva', id: reserva.id }, 'devolucion');
    }

    generarAlertasInventario();
  }

  exports.notificaciones = {
    init,
    crear: crearNotificacion,
    renderizar: renderizarNotificaciones,
    generarRecordatoriosAutomaticos,
    generarAlertasInventario,
    marcarComoLeida,
    marcarTodasComoLeidas,
    resolverPorReferencia,
    notificarNuevaReserva,
    notificarCambioEstadoReserva
  };

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})(window.CIIT);
