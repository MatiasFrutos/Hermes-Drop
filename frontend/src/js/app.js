"use strict";

import { initMap, invalidateMapSize } from "./map.js";
import { getCurrentPosition, formatGeoError } from "./geo.js";
import { setUserLocation } from "./map.js";
import { bindCreateDropEvents } from "./drops.create.js";
import { bindNearbyDropsEvents, scanNearbyDrops } from "./drops.nearby.js";
import { bindUnlockDropEvents } from "./drops.unlock.js";
import { qs, setLocationStatus, showToast, renderIcons } from "./ui.js";

function initApp() {
  initMap();
  bindCreateDropEvents();
  bindNearbyDropsEvents();
  bindUnlockDropEvents();
  bindHeroEvents();

  invalidateMapSize();
  setLocationStatus("Ubicación pendiente");
  renderIcons();

  window.addEventListener("resize", invalidateMapSize);
}

function bindHeroEvents() {
  const openCreateButton = qs("#openCreateDropButton");
  const createPanel = qs("#crear");

  openCreateButton?.addEventListener("click", async () => {
    createPanel?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    await warmUpLocation();
  });
}

async function warmUpLocation() {
  try {
    setLocationStatus("Solicitando ubicación...");

    const position = await getCurrentPosition();

    setUserLocation(position);
    setLocationStatus("Ubicación detectada", "ok");
  } catch (error) {
    setLocationStatus("Ubicación pendiente", "error");
    showToast(formatGeoError(error), "warning");
  } finally {
    renderIcons();
  }
}

document.addEventListener("DOMContentLoaded", initApp);

window.HermesDrop = {
  scanNearbyDrops
};