# 🪽 Hermes Drop

<p align="center">
  <img src="frontend/public/hermes-icon.png" alt="Hermes Drop" width="120" height="120" style="border-radius:50%;" />
</p>

<p align="center">
  <strong>Mensajes que solo existen donde tienen sentido.</strong>
</p>

<p align="center">
  📍 Geolocalización · 🔐 Clave opcional · ⏳ Duración limitada · 🖼️ Foto opcional · 🧭 Sin login
</p>

---

## ✨ Descripción

**Hermes Drop** es una demostración de una aplicación web de mensajería geolocalizada.

Permite crear mensajes llamados **Drops**, asociados a una ubicación física.  
Estos mensajes solo pueden desbloquearse cuando la persona está dentro del rango definido.

No requiere cuenta.  
No requiere registro.  
No usa perfiles.  

La experiencia se basa en una lógica simple:

> 📍 Estar en el lugar correcto desbloquea el mensaje correcto.

---

## 🎯 Propósito del proyecto

Este proyecto fue creado como una demostración funcional de una experiencia digital basada en ubicación.

La idea es explorar cómo combinar:

- Mensajería temporal.
- Geolocalización.
- Contenido efímero.
- Interacción física-digital.
- Experiencias urbanas.
- Drops de lectura única.

Hermes Drop no busca ser una red social tradicional.  
La propuesta es más directa: crear mensajes que viven en lugares específicos.

---

## 🧭 Cómo funciona

### 1. Crear un Drop

El usuario crea un mensaje desde la web.

Puede definir:

- 📝 Título opcional.
- 💬 Mensaje.
- 😀 Emojis.
- 🖼️ Foto opcional.
- 📍 Rango de lectura.
- ⏳ Duración.
- 🔐 Palabra clave opcional.

---

### 2. Buscar Drops cercanos

La aplicación solicita la ubicación del navegador.

Luego compara esa ubicación con los Drops activos.

Si el usuario está dentro del rango permitido, el Drop aparece como disponible.

---

### 3. Desbloquear mensaje

Para leer un Drop, se valida:

- 📍 Ubicación actual.
- 📏 Distancia al punto.
- 🔐 Palabra clave, si fue configurada.
- ⏳ Fecha de expiración.

Si todo coincide, el mensaje se desbloquea.

---

### 4. Lectura única

Una vez que el mensaje se desbloquea correctamente:

- Se muestra el contenido.
- Se muestra la imagen, si existe.
- El Drop se elimina de la base de datos.

Esto convierte cada mensaje en una experiencia efímera.

---

## 🧩 Funcionalidades

### 📍 Mensajes por ubicación

Cada Drop queda asociado a una coordenada específica.

El mensaje solo puede leerse dentro del radio configurado.

---

### 📏 Rango configurable

El creador puede definir el radio de lectura:

- 10 metros.
- 25 metros.
- 50 metros.
- 100 metros.
- 250 metros.
- 500 metros.

---

### ⏳ Duración limitada

Cada Drop tiene una duración.

Cuando vence:

- Deja de aparecer.
- No puede desbloquearse.
- Puede limpiarse desde el backend.

---

### 🔐 Clave opcional

Un Drop puede ser público por ubicación o protegido con palabra clave.

Para Drops protegidos se necesita:

1. Estar dentro del rango.
2. Ingresar la clave correcta.

---

### 🖼️ Foto opcional

El usuario puede adjuntar una imagen al Drop.

La imagen solo se muestra cuando el mensaje se desbloquea correctamente.

---

### 😀 Emojis rápidos

El formulario incluye una barra de emojis animados para crear mensajes más expresivos.

---

### 🗺️ Mapa interactivo

Hermes Drop usa un mapa para visualizar la zona y los Drops disponibles.

---

### 🧹 Eliminación automática al leer

Los Drops son de lectura única.

Cuando alguien los desbloquea, se eliminan de la base.

---

## 🛠️ Tecnologías utilizadas

### Frontend

- HTML
- CSS
- JavaScript
- Lucide Icons
- Leaflet Map
- Geolocation API

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
- Compatible con pgAdmin
- Compatible con Render PostgreSQL
- Compatible con Supabase PostgreSQL

---

## 🎨 Interfaz

La interfaz está pensada para ser:

- Clara.
- Moderna.
- Responsive.
- Animada.
- Ligera.
- Sin fricción.
- Sin login.
- Fácil de usar desde celular.

Incluye:

- Iconografía moderna.
- Animaciones suaves.
- Estados visuales.
- Mapa interactivo.
- Mensajes desbloqueados con mejor presentación.
- Barra de emojis animados.
- Icono personalizado del proyecto.

---

## 📡 API principal

### Estado de la API

GET /api

---

### Crear Drop

POST /api/drops

Body de ejemplo:

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

Body de ejemplo:

{
  "publicCode": "HD-ABC123",
  "latitude": -34.603722,
  "longitude": -58.381592,
  "keyword": "hermes"
}

---

### Reportar Drop

POST /api/drops/report

Body de ejemplo:

{
  "publicCode": "HD-ABC123"
}

---

### Limpiar Drops expirados

DELETE /api/drops/expired

---



## 🔒 Nota sobre geolocalización

Hermes Drop usa la ubicación entregada por el navegador.

Funciona correctamente en:

- localhost
- sitios con HTTPS

En producción se recomienda usar HTTPS.

La ubicación puede variar según el dispositivo:

- En celulares suele ser más precisa.
- En notebooks puede depender de WiFi o IP.
- En escritorio puede ser menos exacta.

---

## ⚠️ Limitaciones

Este proyecto es una demostración funcional.

No debe utilizarse para información crítica, credenciales, pagos, datos sensibles o seguridad de alto riesgo.

La ubicación del navegador puede ser manipulada por usuarios técnicos.

Hermes Drop está pensado para experiencias, juegos, eventos, demostraciones y comunicación geográfica liviana.

---

## 🧪 Estado del proyecto

Hermes Drop se encuentra en etapa de demostración.

Incluye:

- Crear Drops.
- Buscar Drops cercanos.
- Desbloquear por ubicación.
- Clave opcional.
- Foto opcional.
- Emojis animados.
- Mapa interactivo.
- Lectura única.
- Expiración por duración.

---

## 🗺️ Roadmap

### Versión 0.1

- Crear Drops.
- Buscar Drops cercanos.
- Desbloqueo por ubicación.
- Clave opcional.
- Foto opcional.
- Lectura única.
- Expiración por duración.

### Versión 0.2

- Limpieza automática de Drops expirados.
- Mejor radar visual.
- Modo PWA instalable.
- Mejor gestión de imágenes.
- Panel mínimo de moderación.

### Versión 0.3

- Drops encadenados.
- Modo evento.
- Rutas de pistas.
- QR de acceso.
- Estadísticas.
- Modo búsqueda del tesoro.

---

## 🖼️ Icono del proyecto

El icono principal debe guardarse en:

frontend/public/hermes-icon.png

Para que se vea más chico y redondo en GitHub se usa así:

<p align="center">
  <img src="frontend/public/hermes-icon.png" alt="Hermes Drop" width="120" height="120" style="border-radius:50%;" />
</p>

Dentro de la app, el icono se usa como favicon y como marca visual.

---

## 👤 Autor

Proyecto creado por **Matias Isaac Frutos González**.

---

## 📌 Nota

Este repositorio presenta una demostración del proyecto Hermes Drop.

El objetivo es mostrar el concepto, la arquitectura y una implementación funcional de mensajería geolocalizada sin login.
