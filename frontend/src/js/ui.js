"use strict";

let toastTimer = null;

export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

export function qsa(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

export function renderIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

export function setLocationStatus(message, type = "default") {
  const status = qs("#locationStatus");

  if (!status) return;

  status.classList.remove("is-ok", "is-error");

  status.innerHTML = `
    <i data-lucide="${type === "error" ? "map-pin-off" : type === "ok" ? "locate-fixed" : "map-pin"}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  if (type === "ok") {
    status.classList.add("is-ok");
  }

  if (type === "error") {
    status.classList.add("is-error");
  }

  renderIcons();
}

export function showToast(message, type = "default") {
  const toast = qs("#toast");

  if (!toast) return;

  window.clearTimeout(toastTimer);

  toast.textContent = message;
  toast.className = "hd-toast is-visible";

  if (type === "success") {
    toast.classList.add("is-success");
  }

  if (type === "warning") {
    toast.classList.add("is-warning");
  }

  if (type === "danger") {
    toast.classList.add("is-danger");
  }

  toastTimer = window.setTimeout(() => {
    toast.className = "hd-toast";
    toast.textContent = "";
  }, 4200);
}

export function setButtonLoading(button, isLoading, loadingText = "Procesando...") {
  if (!button) return;

  if (isLoading) {
    if (!button.dataset.originalHtml) {
      button.dataset.originalHtml = button.innerHTML;
    }

    button.innerHTML = `
      <i data-lucide="loader-2"></i>
      ${escapeHtml(loadingText)}
    `;

    button.disabled = true;
    renderIcons();

    const icon = button.querySelector("svg");

    if (icon) {
      icon.style.animation = "hdSpin 800ms linear infinite";
    }

    return;
  }

  button.innerHTML = button.dataset.originalHtml || button.innerHTML;
  button.disabled = false;
  renderIcons();
}

export function openDialog(dialog) {
  if (!dialog) return;

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }

  dialog.setAttribute("open", "");
}

export function closeDialog(dialog) {
  if (!dialog) return;

  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }

  dialog.removeAttribute("open");
}

export function openMessageModal({ title = "Hermes Drop", message = "", imageDataUrl = "" }) {
  const modal = qs("#messageModal");
  const titleElement = qs("#messageModalTitle");
  const bodyElement = qs("#messageModalBody");
  const imageWrap = qs("#messageModalImageWrap");
  const imageElement = qs("#messageModalImage");

  if (titleElement) {
    titleElement.textContent = title || "Hermes Drop";
  }

  if (bodyElement) {
    bodyElement.textContent = message || "";
  }

  if (imageWrap && imageElement) {
    if (imageDataUrl) {
      imageElement.src = imageDataUrl;
      imageWrap.hidden = false;
    } else {
      imageElement.removeAttribute("src");
      imageWrap.hidden = true;
    }
  }

  openDialog(modal);
  renderIcons();
}

export function renderEmptyDrops(message) {
  const list = qs("#nearbyDropsList");

  if (!list) return;

  list.innerHTML = `
    <div class="hd-empty">
      <i data-lucide="scan-line"></i>
      <strong>Sin resultados</strong>
      <span>${escapeHtml(message)}</span>
    </div>
  `;

  renderIcons();
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}