# CRUD de Series — Los Simpsons

Aplicación web full-stack para gestionar episodios de *Los Simpsons*. Permite agregar, visualizar, editar y eliminar registros con búsqueda y filtros combinados.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Node.js + Express + Morgan |
| Frontend | HTML5 · CSS3 · JavaScript (vanilla) |
| Persistencia | CSV (sin base de datos) |
| API | REST (GET, POST, PUT, DELETE) |
| Testing | Vitest + Supertest |

## Funcionalidades

- **CRUD completo**: alta, baja, modificación y consulta de episodios
- **Búsqueda server-side**: filtros por título, temporada, director y ratings
- **Paginación**: 20 registros por página, navegación con anterior/siguiente
- **Modo edición**: formulario con feedback visual diferenciado y botón cancelar
- **Validación**: rangos y campos requeridos en cliente y servidor
- **Logging**: registro de cada request HTTP en consola con Morgan
- **Responsive**: adaptado para móviles y escritorio

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- npm (incluido con Node.js)

## Instalación y uso

```bash
# Clonar el repositorio
git clone https://github.com/gogoroisler/crud-series-nodejs.git
cd crud-series-nodejs

# Instalar dependencias
npm install

# Copiar y configurar variables de entorno
cp .env.example .env

# Iniciar el servidor
npm start
```

Abrir en el navegador: **http://localhost:3000**

> El frontend es servido directamente por Express. No es necesario abrir `index.html` como archivo local.

## Variables de entorno

El archivo `.env` permite configurar el servidor sin modificar el código:

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto en el que corre el servidor |
| `CSV_FILE` | `data.csv` | Ruta al archivo de datos |

## Tests

El proyecto incluye 36 tests organizados en unit tests e integration tests.

```bash
# Ejecutar los tests una vez
npm run test:run

# Ejecutar en modo watch (se re-ejecutan al guardar cambios)
npm test
```

```
tests/
├── unit/
│   ├── filterRecords.test.js    # Lógica de filtrado (10 tests)
│   └── validateRecord.test.js  # Validaciones de campos (10 tests)
└── integration/
    └── api.test.js              # Endpoints REST con Supertest (16 tests)
```

Los integration tests usan un CSV de fixture aislado y no modifican `data.csv`.

## Estructura del proyecto

```
crud-series-nodejs/
├── server.js            # Servidor Express, endpoints REST y funciones exportadas
├── script.js            # Lógica del frontend
├── index.html           # Interfaz de usuario
├── styles.css           # Estilos
├── data.csv             # Dataset (674 episodios)
├── vitest.config.js     # Configuración de Vitest
├── .env.example         # Plantilla de variables de entorno
├── package.json
└── tests/
    ├── fixtures/
    │   └── test.csv     # Dataset de prueba (5 episodios)
    ├── unit/
    └── integration/
```

## Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/data` | Obtener todos los registros |
| `GET` | `/api/data/search` | Buscar con filtros (`title`, `season`, `directed_by`, `imdb_rating`, `tmdb_rating`) |
| `POST` | `/api/data` | Agregar un episodio |
| `PUT` | `/api/data/:id` | Modificar un episodio existente |
| `DELETE` | `/api/data/:id` | Eliminar un episodio |

## Dataset

El CSV incluye 674 episodios con título, descripción, fecha de emisión, director, guionista, temporada y audiencia en millones de espectadores. Los campos de rating IMDB/TMDB pueden completarse desde la aplicación.
