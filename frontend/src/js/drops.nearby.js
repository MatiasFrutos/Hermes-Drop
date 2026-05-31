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

export function bindNearbyDropsEvents() {
  const findButton = qs("#findNearbyDropsButton");
  const refreshButton = qs("#refreshNearbyDropsButton");

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

    const position = await getCurrentPosition();

    setUserLocation(position);
    setLocationStatus("Ubicación detectada", "ok");

    const result = await getNearbyDrops(position.latitude, position.longitude);

    currentDrops = result?.data || [];

    renderNearbyDrops(currentDrops);
    renderDropMarkers(currentDrops);

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
    setButtonLoading(button, false);
    renderIcons();
  }
}

function renderNearbyDrops(drops) {
  const list = qs("#nearbyDropsList");

  if (!list) return;

  if (!drops.length) {
    list.innerHTML = `
      <div class="hd-empty">
        <i data-lucide="map-pin-off"></i>
        <strong>No hay Drops cerca</strong>
        <span>Hermes pasó por otro barrio. Probá moverte o crear uno nuevo.</span>
      </div>
    `;

    renderIcons();
    return;
  }

  list.innerHTML = drops.map(renderDropItem).join("");

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