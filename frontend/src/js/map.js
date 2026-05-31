"use strict";

let map = null;
let userMarker = null;
let userAccuracyCircle = null;
let dropLayer = null;

const DEFAULT_CENTER = [-34.603722, -58.381592];

export function initMap() {
  const mapElement = document.getElementById("map");

  if (!mapElement || map) {
    return map;
  }

  map = L.map(mapElement, {
    zoomControl: true,
    attributionControl: true
  }).setView(DEFAULT_CENTER, 12);

  /*
    Hermes Drop
    Antes usábamos tiles de OpenStreetMap directo.
    En algunos entornos devuelve 403 / Access blocked por política de referer.
    Usamos CARTO como proveedor visual basado en OpenStreetMap para evitar ese bloqueo.
  */
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 20,
    attribution: "&copy; OpenStreetMap &copy; CARTO"
  }).addTo(map);

  dropLayer = L.layerGroup().addTo(map);

  return map;
}

export function setUserLocation({ latitude, longitude, accuracy }) {
  if (!map) {
    initMap();
  }

  const latLng = [latitude, longitude];

  if (!userMarker) {
    userMarker = L.marker(latLng).addTo(map);
    userMarker.bindPopup("Tu ubicación actual");
  } else {
    userMarker.setLatLng(latLng);
  }

  if (userAccuracyCircle) {
    userAccuracyCircle.remove();
  }

  userAccuracyCircle = L.circle(latLng, {
    radius: Math.min(Number(accuracy || 0), 120),
    weight: 1,
    opacity: 0.6,
    fillOpacity: 0.12
  }).addTo(map);

  map.setView(latLng, 16);
}

export function renderDropMarkers(drops = []) {
  if (!map) {
    initMap();
  }

  if (!dropLayer) {
    dropLayer = L.layerGroup().addTo(map);
  }

  dropLayer.clearLayers();

  drops.forEach((drop) => {
    if (!drop.latitude || !drop.longitude) {
      return;
    }

    const marker = L.marker([drop.latitude, drop.longitude]);

    const title = drop.title || "Drop Hermes";
    const distance = Math.round(Number(drop.distanceMeters || 0));
    const radius = Number(drop.radiusMeters || 0);
    const lockText = drop.hasKeyword ? "Protegido con clave" : "Sin clave";

    marker.bindPopup(`
      <div class="hd-map-popup">
        <strong>${escapeHtml(title)}</strong>
        <span>${distance} m de distancia</span>
        <span>Radio: ${radius} m</span>
        <span>${lockText}</span>
      </div>
    `);

    marker.addTo(dropLayer);

    L.circle([drop.latitude, drop.longitude], {
      radius,
      weight: 1,
      opacity: 0.55,
      fillOpacity: 0.1
    }).addTo(dropLayer);
  });
}

export function invalidateMapSize() {
  if (!map) return;

  window.setTimeout(() => {
    map.invalidateSize();
  }, 120);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}