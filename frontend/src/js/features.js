"use strict";

import { getNearbyDrops } from "./api.js";
import { scanNearbyDrops } from "./drops.nearby.js";
import {
  centerOnUser,
  clearPickedLocation,
  getMapElement,
  setMapLayer,
  setMapPickMode,
  setPickedRadius,
  setUserLocation
} from "./map.js";
import { qs, qsa, renderIcons, showToast } from "./ui.js";

const LAYER_STEPS = [
  { mode: "auto", label: "Mapa: Auto" },
  { mode: "streets", label: "Mapa: Calles" },
  { mode: "satellite", label: "Mapa: Satélite" }
];

let layerIndex = 0;
let watchId = null;
let lastCheckAt = 0;
let knownCodes = new Set();

export function initFeatures() {
  injectMapTools();
  injectLocationPicker();
  injectCharCounter();
}

/* ---------- Herramientas del mapa ---------- */
function injectMapTools() {
  const wrap = qs("#mapWrap");

  if (!wrap || qs(".hd-map-tools", wrap)) return;

  const tools = document.createElement("div");

  tools.className = "hd-map-tools";
  tools.innerHTML = `
    <button type="button" id="mapLocateBtn"><i data-lucide="crosshair"></i>Centrar en mí</button>
    <button type="button" id="mapLayerBtn"><i data-lucide="layers"></i><span>${LAYER_STEPS[0].label}</span></button>
    <button type="button" id="mapAlertBtn"><i data-lucide="bell-ring"></i><span>Alertas de cercanía</span></button>
    <button type="button" id="mapFullBtn"><i data-lucide="maximize"></i>Pantalla completa</button>
  `;

  wrap.appendChild(tools);

  ["click", "dblclick", "mousedown"].forEach((type) => tools.addEventListener(type, (event) => event.stopPropagation()));

  qs("#mapLocateBtn").addEventListener("click", async () => {
    if (centerOnUser()) return;

    await scanNearbyDrops();
    centerOnUser();
  });

  qs("#mapLayerBtn").addEventListener("click", () => {
    layerIndex = (layerIndex + 1) % LAYER_STEPS.length;

    const step = LAYER_STEPS[layerIndex];

    setMapLayer(step.mode);
    qs("#mapLayerBtn span").textContent = step.label;
  });

  qs("#mapAlertBtn").addEventListener("click", toggleProximityAlerts);

  qs("#mapFullBtn").addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await wrap.requestFullscreen();
      }
    } catch {
      showToast("Tu navegador no permite pantalla completa.", "warning");
    }

    window.setTimeout(() => getMapElement()?.invalidateSize(), 250);
  });

  renderIcons();
}

/* ---------- Alertas de cercanía (modo caminata) ---------- */
function toggleProximityAlerts() {
  const button = qs("#mapAlertBtn");

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    button.classList.remove("is-on");
    showToast("Alertas de cercanía desactivadas.");
    return;
  }

  if (!("geolocation" in navigator)) {
    showToast("Tu navegador no soporta geolocalización.", "warning");
    return;
  }

  knownCodes = new Set();
  lastCheckAt = 0;

  watchId = navigator.geolocation.watchPosition(
    handleWatchPosition,
    () => {
      showToast("No se pudo seguir tu ubicación.", "danger");
      toggleProximityAlerts();
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
  );

  button.classList.add("is-on");
  showToast("Alertas activas: te avisamos cuando haya un Drop a tu alcance.", "success");
}

async function handleWatchPosition(position) {
  const now = Date.now();

  if (now - lastCheckAt < 15000) return;

  lastCheckAt = now;

  const { latitude, longitude, accuracy } = position.coords;

  setUserLocation({ latitude, longitude, accuracy });

  try {
    const result = await getNearbyDrops(latitude, longitude);
    const drops = result?.data || [];
    const fresh = drops.filter((drop) => !knownCodes.has(drop.publicCode));

    drops.forEach((drop) => knownCodes.add(drop.publicCode));

    if (!fresh.length) return;

    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);

    showToast(`🪽 ${fresh.length} Drop(s) a tu alcance. ¡Abrilos!`, "success");
    scanNearbyDrops();
  } catch {
    /* error de red: se reintenta en la próxima posición */
  }
}

/* ---------- Elegir ubicación del Drop en el mapa ---------- */
function injectLocationPicker() {
  const box = qs("#locPick");

  if (!box) return;

  const info = qs("#locPickInfo");
  const buttons = qsa("[data-loc-mode]", box);

  const setMode = (mode) => {
    buttons.forEach((button) => button.classList.toggle("is-active", button.dataset.locMode === mode));

    if (mode === "map") {
      info.textContent = "Tocá el mapa para ubicar el Drop. Podés arrastrar el pin.";
      setMapPickMode(true, ({ latitude, longitude }) => {
        info.textContent = `Punto elegido: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      });
      qs("#mapa")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setMapPickMode(false);
      info.textContent = "Se usará tu posición GPS al guardar.";
    }
  };

  buttons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.locMode)));

  qs("#dropRadius")?.addEventListener("change", (event) => setPickedRadius(event.target.value));

  qs("#createDropForm")?.addEventListener("reset", () => {
    clearPickedLocation();
    setMode("gps");
  });

  window.addEventListener("hermes:drop-created", () => setMode("gps"));
}

/* ---------- Contador de caracteres ---------- */
function injectCharCounter() {
  const textarea = qs("#dropMessage");

  if (!textarea) return;

  const counter = document.createElement("span");

  counter.className = "hd-counter";
  textarea.insertAdjacentElement("afterend", counter);

  const update = () => {
    const max = Number(textarea.maxLength) || 1000;

    counter.textContent = `${textarea.value.length} / ${max}`;
    counter.classList.toggle("is-near", textarea.value.length > max * 0.9);
  };

  textarea.addEventListener("input", update);
  qs("#createDropForm")?.addEventListener("reset", () => window.setTimeout(update, 0));
  update();
}
