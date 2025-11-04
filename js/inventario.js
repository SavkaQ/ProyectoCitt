// Módulo de inventario: listado, filtros y mantenimiento de artículos
window.CIIT = window.CIIT || {};

(function(exports) {
  const estadosValidos = ['disponible', 'prestado', 'danado', 'nuevo'];

  function init() {
    const tablaInventario = document.querySelector('#cuerpoInventario');
    const formularioInventario = document.querySelector('#formInventario');

    if (tablaInventario) {
      configurarFiltros();
      renderizarInventario();
    }

    if (formularioInventario) {
      const usuario = exports.sesion.obtenerUsuarioActual();
      if (!usuario || !['coordinador', 'administrador'].includes(usuario.rol)) {
        formularioInventario.closest('.formulario').style.display = 'none';
      } else {
        formularioInventario.addEventListener('submit', manejarEnvioFormulario);
      }
    }

    renderizarResumenInventario();
  }

  function obtenerInventarioFiltrado() {
    const inventario = exports.storage.obtenerDatos('inventario');
    const texto = (document.querySelector('#busquedaInventario')?.value || '').toLowerCase();
    const categoria = document.querySelector('#filtroCategoria')?.value || 'todos';
    const estado = document.querySelector('#filtroEstado')?.value || 'todos';

    return inventario.filter((item) => {
      const coincideTexto = `${item.nombre} ${item.categoria}`.toLowerCase().includes(texto);
      const coincideCategoria = categoria === 'todos' || item.categoria === categoria;
      const coincideEstado = estado === 'todos' || item.estado === estado;
      return coincideTexto && coincideCategoria && coincideEstado;
    });
  }

  function renderizarInventario() {
    const cuerpo = document.querySelector('#cuerpoInventario');
    if (!cuerpo) return;

    const usuario = exports.sesion.obtenerUsuarioActual();
    const inventarioFiltrado = obtenerInventarioFiltrado();
    const reservas = exports.storage.obtenerDatos('reservas');
    const puedeGestionar = usuario && ['coordinador', 'administrador'].includes(usuario.rol);

    cuerpo.innerHTML = '';

    inventarioFiltrado.forEach((item) => {
      const reservasActivas = reservas.filter(
        (reserva) =>
          reserva.tipo === 'articulo' &&
          reserva.referenciaId === item.id &&
          ['pendiente', 'aprobada'].includes(reserva.estado)
      );

      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${item.nombre}</td>
        <td>${item.categoria}</td>
        <td><span class="etiqueta-estado estado-${item.estado}">${item.estado}</span></td>
        <td>${item.stock}</td>
        <td>${item.descripcion || ''}</td>
        <td>
          <span class="badge">Reservas activas: ${reservasActivas.length}</span>
        </td>
        <td class="tabla-acciones">
          ${puedeGestionar ? `<button class="btn-accion btn-pequeno" data-accion="editar" data-id="${item.id}">Editar</button>` : ''}
          ${puedeGestionar ? `<button class="btn-secundario btn-pequeno" data-accion="eliminar" data-id="${item.id}">Eliminar</button>` : ''}
        </td>
      `;

      cuerpo.appendChild(fila);
    });

    if (puedeGestionar) {
      cuerpo.querySelectorAll('button[data-accion]').forEach((boton) => {
        boton.addEventListener('click', manejarAccionTabla);
      });
    }
  }

  function configurarFiltros() {
    ['#busquedaInventario', '#filtroCategoria', '#filtroEstado'].forEach((selector) => {
      const nodo = document.querySelector(selector);
      if (nodo) {
        nodo.addEventListener('input', renderizarInventario);
        nodo.addEventListener('change', renderizarInventario);
      }
    });

    poblarSelectCategorias();
  }

  function poblarSelectCategorias() {
    const select = document.querySelector('#filtroCategoria');
    if (!select) return;

    const inventario = exports.storage.obtenerDatos('inventario');
    const categorias = Array.from(new Set(inventario.map((item) => item.categoria))).sort();

    select.innerHTML = '<option value="todos">Todas las categorías</option>' +
      categorias.map((categoria) => `<option value="${categoria}">${categoria}</option>`).join('');
  }

  function manejarEnvioFormulario(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const mensaje = formulario.querySelector('.mensaje-form');
    const datos = new FormData(formulario);

    const registro = {
      id: datos.get('id') || exports.storage.generarId('art'),
      nombre: datos.get('nombre').trim(),
      categoria: datos.get('categoria').trim(),
      estado: datos.get('estado'),
      stock: Number(datos.get('stock') || 0),
      descripcion: datos.get('descripcion').trim()
    };

    if (!registro.nombre || !registro.categoria || !registro.estado) {
      exports.validaciones.mostrarMensaje(mensaje, 'error', 'Completa todos los campos obligatorios.');
      return;
    }

    if (!estadosValidos.includes(registro.estado)) {
      exports.validaciones.mostrarMensaje(mensaje, 'error', 'Selecciona un estado válido.');
      return;
    }

    if (registro.stock < 0) {
      exports.validaciones.mostrarMensaje(mensaje, 'error', 'El stock no puede ser negativo.');
      return;
    }

    const inventario = exports.storage.obtenerDatos('inventario');
    const existe = inventario.findIndex((item) => item.id === registro.id);

    if (existe >= 0) {
      inventario[existe] = registro;
      exports.validaciones.mostrarMensaje(mensaje, 'exito', 'Artículo actualizado correctamente.');
    } else {
      inventario.push(registro);
      exports.validaciones.mostrarMensaje(mensaje, 'exito', 'Artículo agregado al inventario.');
    }

    exports.storage.guardarDatos('inventario', inventario);
    formulario.reset();
    formulario.querySelector('[name="id"]').value = '';
    renderizarInventario();
    renderizarResumenInventario();
    poblarSelectCategorias();
  }

  function manejarAccionTabla(evento) {
    const boton = evento.currentTarget;
    const accion = boton.dataset.accion;
    const id = boton.dataset.id;

    if (accion === 'editar') {
      cargarArticuloEnFormulario(id);
    }

    if (accion === 'eliminar') {
      eliminarArticulo(id);
    }
  }

  function cargarArticuloEnFormulario(id) {
    const inventario = exports.storage.obtenerDatos('inventario');
    const articulo = inventario.find((item) => item.id === id);
    const formulario = document.querySelector('#formInventario');
    if (!articulo || !formulario) return;

    formulario.querySelector('[name="id"]').value = articulo.id;
    formulario.querySelector('[name="nombre"]').value = articulo.nombre;
    formulario.querySelector('[name="categoria"]').value = articulo.categoria;
    formulario.querySelector('[name="estado"]').value = articulo.estado;
    formulario.querySelector('[name="stock"]').value = articulo.stock;
    formulario.querySelector('[name="descripcion"]').value = articulo.descripcion || '';
  }

  function eliminarArticulo(id) {
    const reservas = exports.storage.obtenerDatos('reservas');
    const tieneReservas = reservas.some((reserva) =>
      reserva.tipo === 'articulo' &&
      reserva.referenciaId === id &&
      ['pendiente', 'aprobada'].includes(reserva.estado)
    );

    if (tieneReservas) {
      alert('No es posible eliminar artículos con reservas activas.');
      return;
    }

    if (!confirm('¿Eliminar artículo del inventario?')) return;

    const inventario = exports.storage.obtenerDatos('inventario');
    const actualizado = inventario.filter((item) => item.id !== id);
    exports.storage.guardarDatos('inventario', actualizado);
    renderizarInventario();
    renderizarResumenInventario();
    poblarSelectCategorias();
  }

  function renderizarResumenInventario() {
    const contenedor = document.querySelector('#resumenInventario');
    if (!contenedor) return;

    const inventario = exports.storage.obtenerDatos('inventario');
    const resumen = estadosValidos.reduce((acc, estado) => {
      acc[estado] = inventario.filter((item) => item.estado === estado).length;
      return acc;
    }, {});

    contenedor.innerHTML = `
      <div class="estado-inventario">
        <span><i class="punto-disponible"></i> Disponibles: ${resumen.disponible}</span>
        <span><i class="punto-prestado"></i> Prestados: ${resumen.prestado}</span>
        <span><i class="punto-danado"></i> Dañados: ${resumen.danado}</span>
        <span><i class="punto-nuevo"></i> Nuevos: ${resumen.nuevo}</span>
      </div>
    `;
  }

  exports.inventario = {
    init,
    renderizarInventario,
    renderizarResumenInventario
  };

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})(window.CIIT);
