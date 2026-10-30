"use strict";

import { getNearbyDrops, unlockDrop } from "./api.js";
import { getCurrentPosition, getLastKnownPosition, formatGeoError } from "./geo.js";
import { setUserLocation, renderDropMarkers } from "./map.js";
import {
  qs,
  escapeHtml,
  setButtonLoading,
  setLocationStatus,
  showToast,
  openDialog,
  openMessageModal,
  renderIcons
} from "./ui.js";

let currentDrops = [];
let activeFilter = "all";

const FILTERS = [
  { id: "all", label: "Todos", test: () => true },
  { id: "open", label: "Sin clave", test: (drop) => !drop.hasKeyword },
  { id: "locked", label: "Con clave", test: (drop) => Boolean(drop.hasKeyword) },
  { id: "photo", label: "Con foto", test: (drop) => Boolean(drop.hasImage) }
];

const CARDINALS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];

function bearingDegrees(from, to) {
  const rad = Math.PI / 180;
  const y = Math.sin((to.longitude - from.longitude) * rad) * Math.cos(to.latitude * rad);
  const x =
    Math.cos(from.latitude * rad) * Math.sin(to.latitude * rad) -
    Math.sin(from.latitude * rad) * Math.cos(to.latitude * rad) * Math.cos((to.longitude - from.longitude) * rad);

  return (Math.atan2(y, x) / rad + 360) % 360;
}

function renderCompass(drop) {
  const origin = getLastKnownPosition();

  if (!origin || !Number.isFinite(Number(drop.latitude)) || !Number.isFinite(Number(drop.longitude))) {
    return "";
  }

  const degrees = bearingDegrees(origin, { latitude: Number(drop.latitude), longitude: Number(drop.longitude) });
  const cardinal = CARDINALS[Math.round(degrees / 45) % 8];

  return `
    <span class="hd-drop-public__compass" title="Dirección hacia el Drop">
      <i style="transform: rotate(${Math.round(degrees)}deg)">↑</i>
      ${cardinal} · ${Math.round(degrees)}°
    </span>
  `;
}

function injectFilters() {
  const list = qs("#nearbyDropsList");

  if (!list || qs(".px-filters")) return;

  const bar = document.createElement("div");

  bar.className = "px-filters";
  bar.setAttribute("aria-label", "Filtrar Drops");
  bar.innerHTML = FILTERS.map(
    (filter) => `<button type="button" class="px-chip${filter.id === activeFilter ? " is-on" : ""}" data-filter="${filter.id}">${filter.label}</button>`
  ).join("");

  list.insertAdjacentElement("beforebegin", bar);

  bar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");

    if (!button) return;

    activeFilter = button.dataset.filter;
    bar.querySelectorAll("[data-filter]").forEach((chip) => chip.classList.toggle("is-on", chip === button));

    if (currentDrops.length) {
      renderNearbyDrops(currentDrops);
    }
  });
}

function visibleDrops(drops) {
  const filter = FILTERS.find((item) => item.id === activeFilter) || FILTERS[0];

  return drops.filter(filter.test);
}

export function bindNearbyDropsEvents() {
  const findButton = qs("#findNearbyDropsButton");
  const refreshButton = qs("#refreshNearbyDropsButton");

  injectFilters();

  findButton?.addEventListener("click", () => scanNearbyDrops(findButton));
  refreshButton?.addEventListener("click", () => scanNearbyDrops(refreshButton));

  window.addEventListener("hermes:drop-read", (event) => {
    const publicCode = event.detail?.publicCode;

    if (!publicCode) return;

    removeDropFromNearbyList(publicCode);
  });
}

export async function scanNearbyDrops(button = null) {
  try {
    setButtonLoading(button, true, "Escaneando...");
    window.dispatchEvent(new CustomEvent("hermes:scan", { detail: { scanning: true } }));

    const position = await getCurrentPosition();

    setUserLocation(position);
    setLocationStatus("Ubicación detectada", "ok");

    const result = await getNearbyDrops(position.latitude, position.longitude);

    currentDrops = result?.data || [];

    renderNearbyDrops(currentDrops);
    renderDropMarkers(currentDrops);
    window.dispatchEvent(new CustomEvent("hermes:nearby", { detail: { drops: currentDrops } }));

    if (!currentDrops.length) {
      showToast("No hay Drops cercanos en esta zona.", "warning");
      return;
    }

    showToast(`Se encontraron ${currentDrops.length} Drop(s) cercanos.`, "success");
  } catch (error) {
    if (error?.message?.startsWith("GEOLOCATION")) {
      setLocationStatus("Error de ubicación", "error");
      showToast(formatGeoError(error), "danger");
      return;
    }

    showToast(error?.payload?.error || "No se pudieron buscar Drops cercanos.", "danger");
  } finally {
    window.dispatchEvent(new CustomEvent("hermes:scan", { detail: { scanning: false } }));
    setButtonLoading(button, false);
    renderIcons();
  }
}

function renderNearbyDrops(drops) {
  const list = qs("#nearbyDropsList");

  if (!list) return;

  const shown = visibleDrops(drops);

  if (!shown.length) {
    list.innerHTML = `
      <div class="hd-empty">
        <i data-lucide="map-pin-off"></i>
        <strong>${drops.length ? "Ningún Drop coincide" : "No hay Drops cerca"}</strong>
        <span>${drops.length ? "Probá con otro filtro." : "Hermes pasó por otro barrio. Probá moverte o crear uno nuevo."}</span>
      </div>
    `;

    renderIcons();
    return;
  }

  list.innerHTML = shown.map(renderDropItem).join("");

  list.querySelectorAll("[data-unlock-drop]").forEach((button) => {
    button.addEventListener("click", () => {
      const publicCode = button.dataset.unlockDrop;
      const drop = currentDrops.find((item) => item.publicCode === publicCode);

      if (!drop) {
        showToast("No se encontró el Drop seleccionado.", "danger");
        return;
      }

      handleDropUnlock(drop);
    });
  });

  renderIcons();
}

function renderDropItem(drop) {
  const title = drop.title || "Mensaje cercano";
  const distance = Math.round(Number(drop.distanceMeters || 0));
  const radius = Number(drop.radiusMeters || 0);
  const hasKeyword = Boolean(drop.hasKeyword);
  const hasImage = Boolean(drop.hasImage);

  return `
    <div class="hd-drop-item hd-drop-item--public" data-drop-card="${escapeHtml(drop.publicCode)}">
      <div class="hd-drop-public__main">
        <div class="hd-drop-public__icon">
          <i data-lucide="${hasKeyword ? "lock-keyhole" : "mail-open"}"></i>
        </div>

        <div class="hd-drop-public__content">
          <div class="hd-drop-public__title-row">
            <h4>${escapeHtml(title)}</h4>
            <span class="hd-drop-public__status">
              <i data-lucide="locate-fixed"></i>
              Disponible acá
            </span>
          </div>

          <p>
            Estás dentro del área de lectura. Este Drop se puede abrir porque estás a
            <strong>${distance} m</strong> del punto.
          </p>

          ${renderCompass(drop)}

          <div class="hd-drop-public__progress" aria-hidden="true">
            <span style="width: ${calculateDistanceProgress(distance, radius)}%;"></span>
          </div>

          <div class="hd-drop-public__meta">
            <span>
              <i data-lucide="radio-tower"></i>
              Radio ${radius} m
            </span>

            <span>
              <i data-lucide="${hasKeyword ? "key-round" : "unlock"}"></i>
              ${hasKeyword ? "Requiere clave" : "Sin clave"}
            </span>

            <span>
              <i data-lucide="${hasImage ? "image" : "image-off"}"></i>
              ${hasImage ? "Incluye foto" : "Solo texto"}
            </span>

            <span>
              <i data-lucide="flame"></i>
              Lectura única
            </span>
          </div>
        </div>
      </div>

      <div class="hd-drop-public__actions">
        <button class="hd-btn hd-btn--compact hd-btn--read" type="button" data-unlock-drop="${escapeHtml(drop.publicCode)}">
          <i data-lucide="${hasKeyword ? "key-round" : "sparkles"}"></i>
          ${hasKeyword ? "Desbloquear" : "Leer ahora"}
        </button>
      </div>
    </div>
  `;
}

function calculateDistanceProgress(distance, radius) {
  const safeRadius = Math.max(Number(radius || 1), 1);
  const safeDistance = Math.max(Number(distance || 0), 0);
  const value = 100 - Math.min((safeDistance / safeRadius) * 100, 100);

  return Math.max(Math.round(value), 8);
}

async function handleDropUnlock(drop) {
  if (drop.hasKeyword) {
    const modal = qs("#unlockModal");
    const publicCodeInput = qs("#unlockPublicCode");
    const keywordInput = qs("#unlockKeyword");

    if (publicCodeInput) {
      publicCodeInput.value = drop.publicCode;
    }

    if (keywordInput) {
      keywordInput.value = "";
    }

    openDialog(modal);
    keywordInput?.focus();
    renderIcons();

    return;
  }

  try {
    const position = getLastKnownPosition() || await getCurrentPosition();

    const result = await unlockDrop({
      publicCode: drop.publicCode,
      latitude: position.latitude,
      longitude: position.longitude,
      keyword: ""
    });

    openMessageModal({
      title: result?.data?.title || drop.title || "Hermes Drop",
      message: result?.data?.message || result?.message || "Mensaje desbloqueado.",
      imageDataUrl: result?.data?.imageDataUrl || ""
    });

    dispatchDropRead(drop.publicCode);
  } catch (error) {
    showToast(error?.payload?.error || "No se pudo desbloquear el Drop.", "danger");
  } finally {
    renderIcons();
  }
}

function removeDropFromNearbyList(publicCode) {
  currentDrops = currentDrops.filter((drop) => drop.publicCode !== publicCode);

  const card = qs(`[data-drop-card="${CSS.escape(publicCode)}"]`);

  if (card) {
    card.style.animation = "hdDropOut 220ms ease both";

    window.setTimeout(() => {
      renderNearbyDrops(currentDrops);
      renderDropMarkers(currentDrops);
    }, 220);

    return;
  }

  renderNearbyDrops(currentDrops);
  renderDropMarkers(currentDrops);
}

function dispatchDropRead(publicCode) {
  window.dispatchEvent(
    new CustomEvent("hermes:drop-read", {
      detail: {
        publicCode
      }
    })
  );
}