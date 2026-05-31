# Hermes Drop

![Hermes Drop](frontend/public/hermes-icon.png)

## Mensajería geolocalizada sin login

**Hermes Drop** es una aplicación web para crear mensajes geolocalizados que solo pueden leerse cuando la persona está físicamente dentro del rango definido.

No usa login.  
No usa registro.  
No usa perfiles.  
Solo ubicación, rango, duración, mensaje, foto opcional y una clave opcional.

---

## Concepto

> Mensajes que solo existen donde tienen sentido.

Hermes Drop permite dejar un mensaje en una ubicación física.  
Ese mensaje queda bloqueado hasta que otra persona llega al lugar correcto.

Es una experiencia digital atada al mundo real.

---

## ¿Para qué sirve?

Hermes Drop puede usarse para:

- Juegos urbanos.
- Búsquedas del tesoro.
- Mensajes temporales.
- Experiencias interactivas.
- Eventos.
- Pistas geográficas.
- Notas anónimas por ubicación.
- Drops digitales de lectura única.
- Activaciones de marca.
- Comunicación física-digital sin cuentas.

---

## Funcionalidades principales

### Crear Drops

El usuario puede crear un mensaje desde la web definiendo:

- Título opcional.
- Mensaje.
- Emojis.
- Foto opcional.
- Rango de lectura.
- Duración.
- Palabra clave opcional.

---

### Leer Drops cercanos

La app obtiene la ubicación desde el navegador y busca mensajes disponibles cerca.

Si la persona está dentro del rango definido, puede desbloquear el Drop.

---

### Desbloqueo por ubicación

Cada Drop se valida contra la ubicación actual del usuario.

Ejemplo:

Radio del Drop: 50 metros
Distancia del usuario: 32 metros
Resultado: desbloqueable

Si el usuario está fuera del rango, el mensaje no se muestra.

---

### Palabra clave opcional

Un Drop puede estar protegido con una clave.

Para leerlo se necesita:

1. Estar dentro del rango.
2. Ingresar la palabra clave correcta.

---

### Foto opcional

Cada Drop puede incluir una imagen adjunta.

La foto se muestra únicamente cuando el mensaje se desbloquea correctamente.

---

### Lectura única

Cuando un Drop se lee correctamente:

1. Se entrega el mensaje.
2. Se muestra la foto si existe.
3. Se elimina de la base de datos.

Esto permite que los mensajes funcionen como contenido efímero.

---

### Duración del mensaje

Cada Drop tiene una fecha de expiración.

Cuando vence:

- El Drop deja de aparecer.
- El Drop ya no puede leerse.

Además, el backend incluye una ruta para limpiar Drops expirados.

---

## Stack tecnológico

### Frontend

- HTML
- CSS
- JavaScript
- Lucide Icons
- Leaflet Map
- Geolocation API del navegador

### Backend

- Node.js
- Express.js
- PostgreSQL
- bcryptjs
- dotenv
- helmet
- cors
- morgan

### Base de datos

- PostgreSQL
- Compatible con pgAdmin, Render PostgreSQL o Supabase PostgreSQL

---

## Estructura del proyecto

hermes-drop/
│
├── backend/
│   ├── app.js
│   ├── server.js
│   │
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   └── drops.controller.js
│   │
│   ├── database/
│   │   ├── schema.sql
│   │   └── seed.sql
│   │
│   ├── middlewares/
│   │   ├── errorHandler.js
│   │   └── rateLimit.js
│   │
│   ├── routes/
│   │   └── drops.routes.js
│   │
│   ├── services/
│   │   └── drops.service.js
│   │
│   └── utils/
│       ├── distance.js
│       ├── hash.js
│       └── validators.js
│
├── frontend/
│   ├── index.html
│   │
│   ├── public/
│   │   ├── favicon.svg
│   │   └── hermes-icon.png
│   │
│   └── src/
│       ├── css/
│       │   ├── buttons.css
│       │   ├── forms.css
│       │   ├── layout.css
│       │   ├── map.css
│       │   └── styles.css
│       │
│       └── js/
│           ├── api.js
│           ├── app.js
│           ├── drops.create.js
│           ├── drops.nearby.js
│           ├── drops.unlock.js
│           ├── geo.js
│           ├── map.js
│           └── ui.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md

---

## Instalación local

### 1. Clonar el repositorio

git clone https://github.com/TU_USUARIO/hermes-drop.git
cd hermes-drop

---

### 2. Instalar dependencias

npm install

---

### 3. Crear la base de datos

Crear una base PostgreSQL llamada:

hermes_drop

Luego ejecutar el archivo:

backend/database/schema.sql

Opcionalmente se puede ejecutar:

backend/database/seed.sql

---

### 4. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/hermes_drop
NODE_ENV=development

DROP_MAX_RADIUS_METERS=500
DROP_MAX_DURATION_MINUTES=10080
DROP_CREATE_LIMIT_PER_HOUR=20
IP_HASH_SECRET=hermes_drop_local_secret

---

### 5. Ejecutar el proyecto

npm run dev

Abrir en el navegador:

http://localhost:3000

---

## Scripts disponibles

npm run dev

Ejecuta el proyecto en modo desarrollo.

npm start

Ejecuta el proyecto en modo producción.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| PORT | Puerto donde corre el servidor |
| DATABASE_URL | URL de conexión PostgreSQL |
| NODE_ENV | Entorno de ejecución |
| DROP_MAX_RADIUS_METERS | Rango máximo permitido para un Drop |
| DROP_MAX_DURATION_MINUTES | Duración máxima permitida |
| DROP_CREATE_LIMIT_PER_HOUR | Límite de creación por IP |
| IP_HASH_SECRET | Clave para hashear IPs |

---

## API principal

### Estado de la API

GET /api

---

### Crear Drop

POST /api/drops

Body:

{
  "title": "Mensaje secreto",
  "message": "La pista está cerca del árbol.",
  "imageDataUrl": "",
  "latitude": -34.603722,
  "longitude": -58.381592,
  "radiusMeters": 50,
  "durationMinutes": 1440,
  "keyword": "hermes"
}

---

### Buscar Drops cercanos

GET /api/drops/nearby?lat=-34.603722&lng=-58.381592

---

### Desbloquear Drop

POST /api/drops/unlock

Body:

{
  "publicCode": "HD-ABC123",
  "latitude": -34.603722,
  "longitude": -58.381592,
  "keyword": "hermes"
}

---

### Reportar Drop

POST /api/drops/report

Body:

{
  "publicCode": "HD-ABC123"
}

---

### Limpiar Drops expirados

DELETE /api/drops/expired

---

## Deploy recomendado

Para subirlo rápido sin cambiar demasiado la arquitectura:

Render Web Service + PostgreSQL

También puede usarse:

Render + Supabase PostgreSQL

---

## Importante sobre geolocalización

La geolocalización funciona correctamente en:

localhost

o en sitios con:

HTTPS

En producción se recomienda usar HTTPS. Render proporciona HTTPS automáticamente.

---

## Limitaciones

Hermes Drop usa la ubicación entregada por el navegador.

Esto significa que:

- En celulares suele ser bastante precisa.
- En notebooks puede ser menos precisa.
- Usuarios técnicos podrían falsear su ubicación.

Por eso Hermes Drop está pensado para experiencias, juegos, eventos y mensajes geográficos, no para seguridad crítica.

---

## Seguridad básica incluida

- No hay usuarios.
- No hay emails.
- No hay contraseñas de cuenta.
- La clave del Drop se guarda hasheada.
- Los mensajes vencen.
- Los mensajes se eliminan al leerse.
- Existe límite de creación por IP.
- Existen reportes básicos.

---

## Roadmap

### Versión 0.1

- Crear Drops.
- Buscar Drops cercanos.
- Desbloqueo por ubicación.
- Clave opcional.
- Foto opcional.
- Lectura única.
- Expiración por duración.

### Versión 0.2

- Limpieza automática de expirados.
- Panel mínimo de moderación.
- Supabase Storage para imágenes.
- Mejor radar de Drops cercanos.
- PWA instalable.

### Versión 0.3

- Modo evento.
- Drops encadenados.
- Rutas de pistas.
- Estadísticas.
- QR de acceso.
- Modo búsqueda del tesoro.

---

## Icono

El icono principal debe guardarse en:

frontend/public/hermes-icon.png

Y se usa desde:

<link rel="icon" href="./public/hermes-icon.png" type="image/png" />
<link rel="apple-touch-icon" href="./public/hermes-icon.png" />

---

## Autor

Proyecto creado por Matías Isaac Frutos González.

---

## Derechos de uso

Este proyecto es de uso privado y propietario.

No está autorizado su uso, copia, modificación, redistribución, publicación, comercialización ni explotación total o parcial sin autorización expresa del autor.

El código, diseño, concepto, nombre, estructura, iconografía y documentación pertenecen a su autor.

---

## Licencia

Todos los derechos reservados.

Este proyecto no es software libre ni de código abierto.
