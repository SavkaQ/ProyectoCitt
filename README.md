# Proyecto CIIT

Plataforma web académica para el Centro de Innovación e Integración Tecnológica (CIIT) de Duoc UC. Permite gestionar inventario, reservas de artículos y espacios, y la administración de usuarios con persistencia local mediante `localStorage`.

## Estructura del proyecto

```
/ciit/
├── index.html
├── css/
│   └── estilos.css
├── js/
│   ├── main.js
│   ├── permisos.js
│   ├── inventario.js
│   ├── reservas.js
│   ├── usuarios.js
│   └── validaciones.js
├── views/
│   ├── login.html
│   ├── registro.html
│   ├── home.html
│   ├── inventario.html
│   ├── reservas.html
│   ├── admin.html
│   └── coordinador.html
└── data/
    └── base.json
```

## Puesta en marcha

1. Clona el repositorio o descarga los archivos.
2. Abre `index.html` en un navegador moderno. Todo el flujo funciona sin servidores adicionales gracias al uso de `localStorage`.
3. Accede con una de las cuentas preconfiguradas en `data/base.json`, por ejemplo:
   - Administrador: `ana.perez@duocuc.cl` / `Admin1234`
   - Coordinador: `bruno.silva@duocuc.cl` / `Coord1234`
   - Estudiante: `carla.diaz@duocuc.cl` / `Carla1234`

## Funcionalidades clave

- **Autenticación y roles:** Validación de correos @duocuc.cl, contraseñas seguras y control de navegación según permisos.
- **Inventario:** Consulta, filtros dinámicos y mantenimiento de artículos (solo coordinador/administrador).
- **Reservas:** Catálogo interactivo, disponibilidad por stock o estado y aprobación/rechazo por parte de coordinadores.
- **Administración:** Gestión de usuarios, actualización de roles y reportes resumidos.
- **Experiencia de uso:** Diseño responsivo con modo claro/oscuro y mensajes contextuales para cada acción.

Todas las acciones quedan registradas localmente, por lo que cerrar la pestaña no elimina la información almacenada.
