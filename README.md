# CRUD de Series — Los Simpsons

Aplicación web full-stack para gestionar episodios de *Los Simpsons*. Permite agregar, visualizar, editar y eliminar registros con búsqueda y filtros combinados.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Node.js + Express |
| Frontend | HTML5 · CSS3 · JavaScript (vanilla) |
| Persistencia | CSV (sin base de datos) |
| API | REST (GET, POST, PUT, DELETE) |

## Funcionalidades

- **CRUD completo**: alta, baja, modificación y consulta de episodios
- **Búsqueda server-side**: filtros por título, temporada, director y ratings
- **Paginación**: 20 registros por página, navegación con anterior/siguiente
- **Modo edición**: formulario con feedback visual diferenciado y botón cancelar
- **Validación**: rangos y campos requeridos en cliente y servidor
- **Responsive**: adaptado para móviles y escritorio

## Requisitos

- [Node.js](https://nodejs.org/) v16 o superior
- npm (incluido con Node.js)

## Instalación y uso

```bash
# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd crud-series-simpsons

# Instalar dependencias
npm install

# Iniciar el servidor
npm start
```

Abrir en el navegador: **http://localhost:3000**

> El frontend es servido directamente por Express. No es necesario abrir `index.html` como archivo.

## Estructura del proyecto

```
crud-series-simpsons/
├── server.js        # Servidor Express y endpoints REST
├── script.js        # Lógica del frontend
├── index.html       # Interfaz de usuario
├── styles.css       # Estilos
├── data.csv         # Base de datos (674 episodios)
└── package.json
```

## Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/data` | Obtener todos los registros |
| `GET` | `/api/data/search` | Buscar con filtros (`title`, `season`, `directed_by`, `imdb_rating`, `tmdb_rating`) |
| `POST` | `/api/data` | Agregar un episodio |
| `PUT` | `/api/data/:id` | Modificar un episodio existente |
| `DELETE` | `/api/data/:id` | Eliminar un episodio |

## Notas sobre el dataset

El CSV incluye 674 episodios con título, descripción, fecha de emisión, director, guionista, temporada y audiencia en millones de espectadores. Los campos de rating IMDB/TMDB pueden completarse manualmente desde la aplicación.
