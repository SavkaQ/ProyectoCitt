<<<<<<< HEAD
// Módulo principal del CIIT: gestión de almacenamiento, sesión y utilidades globales
=======
// Entrada principal alternativa
>>>>>>> sync-conflicto
window.CIIT = window.CIIT || {};

(function(exports) {
  const STORAGE_KEYS = {
    usuarios: 'ciit_usuarios',
    inventario: 'ciit_inventario',
    espacios: 'ciit_espacios',
    reservas: 'ciit_reservas',
    notificaciones: 'ciit_notificaciones',
    sesion: 'ciit_sesion',
    tema: 'ciit_tema'
  };

  const datosIniciales = {
    usuarios: [],
    inventario: [],
    espacios: [],
    reservas: [],
    notificaciones: []
  };

  let datosCargados = false;

  /**
   * Inicializa el sistema cargando datos y aplicando la sesión activa.
   */
  async function init() {
    if (!datosCargados) {
      await cargarDatosIniciales();
      datosCargados = true;
    }

    aplicarTemaGuardado();
    inicializarInterruptorTema();
    actualizarEstadoDeSesion();

    if (exports.permisos && typeof exports.permisos.aplicarVisibilidad === 'function') {
      exports.permisos.aplicarVisibilidad();
    }

    const requerimiento = document.body?.dataset?.requiere;
    if (exports.permisos && typeof exports.permisos.requerirSesion === 'function' && requerimiento !== undefined) {
      const roles = requerimiento
        ? requerimiento.split(',').map((rol) => rol.trim()).filter(Boolean)
        : [];
      exports.permisos.requerirSesion(roles);
    }
  }

  /**
   * Obtiene datos desde localStorage y, si no existen, carga desde base.json.
   */
  async function cargarDatosIniciales() {
    try {
      const rutaBase = window.location.pathname.includes('/views/')
        ? '../data/base.json'
        : './data/base.json';
      const respuesta = await fetch(rutaBase).catch(() => null);
      if (respuesta && respuesta.ok) {
        const json = await respuesta.json();
        Object.assign(datosIniciales, json);
      }
    } catch (error) {
      console.warn('No fue posible cargar base.json, se usarán datos predefinidos', error);
      Object.assign(datosIniciales, obtenerDatosDeRespaldo());
    }

    if (datosIniciales.usuarios.length === 0) {
      Object.assign(datosIniciales, obtenerDatosDeRespaldo());
    }

    for (const clave of Object.keys(datosIniciales)) {
      if (!localStorage.getItem(STORAGE_KEYS[clave])) {
        localStorage.setItem(STORAGE_KEYS[clave], JSON.stringify(datosIniciales[clave]));
      }
    }
  }

  /**
   * Datos de respaldo en caso de que el fetch falle (navegación por file://).
   */
  function obtenerDatosDeRespaldo() {
    return {
      usuarios: [
        {
          id: 'admin-1',
          nombre: 'Ana Pérez',
          correo: 'ana.perez@duocuc.cl',
          rut: '11.111.111-1',
          rol: 'administrador',
          contrasena: 'Admin1234'
        },
        {
          id: 'coord-1',
          nombre: 'Bruno Silva',
          correo: 'bruno.silva@duocuc.cl',
          rut: '22.222.222-2',
          rol: 'coordinador',
          contrasena: 'Coord1234'
        },
        {
          id: 'user-1',
          nombre: 'Carla Díaz',
          correo: 'carla.diaz@duocuc.cl',
          rut: '18.765.432-1',
          rol: 'estudiante',
          contrasena: 'Carla1234'
        }
      ],
      inventario: [
        {
          id: 'art-1',
          nombre: 'Cámara DSLR',
          categoria: 'Audiovisual',
          estado: 'disponible',
          stock: 5,
          descripcion: 'Canon EOS con lente 18-55mm'
        },
        {
          id: 'art-2',
          nombre: 'Notebook HP',
          categoria: 'Computación',
          estado: 'prestado',
          stock: 10,
          descripcion: 'Equipo i5 8GB RAM'
        },
        {
          id: 'art-3',
          nombre: 'Proyector Epson',
          categoria: 'Audiovisual',
          estado: 'danado',
          stock: 2,
          descripcion: 'Requiere mantención'
        },
        {
          id: 'art-4',
          nombre: 'Micrófono Inalámbrico',
          categoria: 'Audio',
          estado: 'nuevo',
          stock: 6,
          descripcion: 'Kit doble canal'
        }
      ],
      espacios: [
        {
          id: 'esp-1',
          nombre: 'Sala Audiovisual 101',
          capacidad: 25,
          estado: 'disponible',
          recursos: ['Proyector', 'Sistema de sonido', 'Pizarras']
        },
        {
          id: 'esp-2',
          nombre: 'Laboratorio MAC',
          capacidad: 18,
          estado: 'prestado',
          recursos: ['iMac', 'Adobe Suite', 'Impresora']
        },
        {
          id: 'esp-3',
          nombre: 'Sala Innovación',
          capacidad: 30,
          estado: 'nuevo',
          recursos: ['Pantallas táctiles', 'Mobiliario modular']
        }
      ],
      reservas: [
        {
          id: 'res-1',
          usuarioId: 'user-1',
          tipo: 'articulo',
          referenciaId: 'art-1',
          nombre: 'Cámara DSLR',
          solicitante: 'Carla Díaz',
          rut: '18.765.432-1',
          fecha: '2024-04-02',
          estado: 'aprobada'
        },
        {
          id: 'res-2',
          usuarioId: 'coord-1',
          tipo: 'espacio',
          referenciaId: 'esp-2',
          nombre: 'Laboratorio MAC',
          solicitante: 'Bruno Silva',
          rut: '22.222.222-2',
          fecha: '2024-04-03',
          estado: 'pendiente'
        }
      ],
      notificaciones: [
        {
          id: 'not-1',
          tipo: 'confirmacion',
          titulo: 'Reserva aprobada',
          descripcion: 'La reserva de Cámara DSLR fue aprobada. Retira el equipo en coordinación con el laboratorio.',
          fecha: new Date().toISOString(),
          destinatarios: { global: false, roles: [], usuarios: ['user-1'] },
          referencia: { tipo: 'reserva', id: 'res-1' },
          importancia: 'media',
          leidoPor: [],
          archivada: false
        }
      ]
    };
  }

  function obtenerDatos(clave) {
    const guardado = localStorage.getItem(STORAGE_KEYS[clave]);
    return guardado ? JSON.parse(guardado) : [];
  }

  function guardarDatos(clave, datos) {
    localStorage.setItem(STORAGE_KEYS[clave], JSON.stringify(datos));
  }

  function generarId(prefijo) {
    return `${prefijo}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function obtenerUsuarioActual() {
    const sesion = localStorage.getItem(STORAGE_KEYS.sesion);
    return sesion ? JSON.parse(sesion) : null;
  }

  function establecerUsuarioActual(usuario) {
    if (usuario) {
      localStorage.setItem(STORAGE_KEYS.sesion, JSON.stringify(usuario));
    } else {
      localStorage.removeItem(STORAGE_KEYS.sesion);
    }
  }

  function cerrarSesion() {
    establecerUsuarioActual(null);
    const destino = window.location.pathname.includes('/views/')
      ? './login.html'
      : './views/login.html';
    window.location.href = destino;
  }

  function actualizarEstadoDeSesion() {
    const usuario = obtenerUsuarioActual();
    const marcadorUsuario = document.querySelector('.usuario-activo');
    const botonSalir = document.querySelector('#btnSalir');

    if (marcadorUsuario) {
      if (usuario) {
        marcadorUsuario.textContent = `${usuario.nombre} · ${usuario.rol.toUpperCase()}`;
        marcadorUsuario.classList.add('visible');
      } else {
        marcadorUsuario.textContent = '';
        marcadorUsuario.classList.remove('visible');
      }
    }

    if (botonSalir) {
      botonSalir.classList.toggle('visible', Boolean(usuario));
      if (!botonSalir.dataset.listener) {
        botonSalir.addEventListener('click', (event) => {
          event.preventDefault();
          const confirmar = confirm('¿Deseas cerrar sesión?');
          if (confirmar) {
            cerrarSesion();
          }
        });
        botonSalir.dataset.listener = 'true';
      }
    }

    const enlacesProtegidos = document.querySelectorAll('[data-requiere]');
    enlacesProtegidos.forEach((enlace) => {
      const rolesPermitidos = enlace.dataset.requiere
        .split(',')
        .map((rol) => rol.trim())
        .filter(Boolean);

      if (rolesPermitidos.length === 0) {
        enlace.classList.remove('oculto');
        return;
      }

      const visible = usuario && rolesPermitidos.includes(usuario.rol);
      enlace.classList.toggle('oculto', !visible);
    });

    if (exports.notificaciones && typeof exports.notificaciones.renderizar === 'function') {
      exports.notificaciones.renderizar();
    }
  }

  function aplicarTemaGuardado() {
    const tema = localStorage.getItem(STORAGE_KEYS.tema) || 'claro';
    document.body.classList.toggle('tema-oscuro', tema === 'oscuro');
  }

  function inicializarInterruptorTema() {
    const switchTema = document.querySelector('#interruptorTema');
    if (!switchTema) return;

    const temaActual = document.body.classList.contains('tema-oscuro') ? 'oscuro' : 'claro';
    switchTema.checked = temaActual === 'oscuro';

    switchTema.addEventListener('change', () => {
      const nuevoTema = switchTema.checked ? 'oscuro' : 'claro';
      document.body.classList.toggle('tema-oscuro', nuevoTema === 'oscuro');
      localStorage.setItem(STORAGE_KEYS.tema, nuevoTema);
    });
  }

  function redirigirSegunRol(rol) {
    if (rol === 'administrador') {
      window.location.href = '../views/admin.html';
    } else if (rol === 'coordinador') {
      window.location.href = '../views/coordinador.html';
    } else {
      window.location.href = '../views/home.html';
    }
  }

  exports.storage = {
    obtenerDatos,
    guardarDatos,
    generarId,
    claves: STORAGE_KEYS
  };

  exports.sesion = {
    obtenerUsuarioActual,
    establecerUsuarioActual,
    cerrarSesion,
    redirigirSegunRol
  };

  exports.init = init;
})(window.CIIT);

// Inicializar aplicación una vez cargado el DOM
if (document.readyState !== 'loading') {
  window.CIIT.init();
} else {
  document.addEventListener('DOMContentLoaded', () => window.CIIT.init());
}
