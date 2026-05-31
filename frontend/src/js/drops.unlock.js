"use strict";

import { unlockDrop } from "./api.js";
import { getCurrentPosition, getLastKnownPosition, formatGeoError } from "./geo.js";
import { setUserLocation } from "./map.js";
import {
  qs,
  closeDialog,
  setButtonLoading,
  setLocationStatus,
  showToast,
  openMessageModal,
  renderIcons
} from "./ui.js";

export function bindUnlockDropEvents() {
  const form = qs("#unlockDropForm");
  const closeUnlockButton = qs("#closeUnlockModalButton");
  const closeMessageButton = qs("#closeMessageModalButton");

  form?.addEventListener("submit", handleUnlockSubmit);

  closeUnlockButton?.addEventListener("click", () => {
    closeDialog(qs("#unlockModal"));
  });

  closeMessageButton?.addEventListener("click", () => {
    closeDialog(qs("#messageModal"));
  });
}

async function handleUnlockSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');

  const publicCode = qs("#unlockPublicCode")?.value || "";
  const keyword = qs("#unlockKeyword")?.value || "";

  if (!publicCode) {
    showToast("No se encontró el código del Drop.", "danger");
    return;
  }

  if (!keyword.trim()) {
    showToast("Ingresá la palabra clave.", "warning");
    return;
  }

  try {
    setButtonLoading(submitButton, true, "Validando lugar...");

    const position = getLastKnownPosition() || await getCurrentPosition();

    setUserLocation(position);
    setLocationStatus("Ubicación detectada", "ok");

    setButtonLoading(submitButton, true, "Desbloqueando...");

    const result = await unlockDrop({
      publicCode,
      keyword: keyword.trim(),
      latitude: position.latitude,
      longitude: position.longitude
    });

    closeDialog(qs("#unlockModal"));

    form.reset();

    openMessageModal({
      title: result?.data?.title || "Hermes Drop",
      message: result?.data?.message || result?.message || "Mensaje desbloqueado.",
      imageDataUrl: result?.data?.imageDataUrl || ""
    });

    dispatchDropRead(publicCode);
  } catch (error) {
    if (error?.message?.startsWith("GEOLOCATION")) {
      setLocationStatus("Error de ubicación", "error");
      showToast(formatGeoError(error), "danger");
      return;
    }

    const code = error?.payload?.error;

    if (code === "INVALID_KEYWORD") {
      showToast("Clave incorrecta. Hermes no entrega el paquete todavía.", "danger");
      return;
    }

    if (code === "LOCATION_OUT_OF_RANGE") {
      const distance = Math.round(Number(error?.payload?.distanceMeters || 0));
      showToast(`Estás fuera del rango. Distancia aproximada: ${distance} metros.`, "warning");
      return;
    }

    if (code === "DROP_NOT_FOUND" || code === "DROP_NOT_AVAILABLE") {
      showToast("Este Drop ya fue leído o ya no está disponible.", "warning");
      dispatchDropRead(publicCode);
      return;
    }

    showToast(code || "No se pudo desbloquear el Drop.", "danger");
  } finally {
    setButtonLoading(submitButton, false);
    renderIcons();
  }
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