"use strict";

import { createDrop } from "./api.js";
import { getCurrentPosition, formatGeoError } from "./geo.js";
import { setUserLocation } from "./map.js";
import { qs, qsa, setButtonLoading, setLocationStatus, showToast, renderIcons } from "./ui.js";

let selectedImageDataUrl = "";

export function bindCreateDropEvents() {
  const form = qs("#createDropForm");
  const imageInput = qs("#dropImage");
  const removeImageButton = qs("#removeDropImageButton");

  if (!form) return;

  form.addEventListener("submit", handleCreateDropSubmit);
  form.addEventListener("reset", handleFormReset);

  qsa("[data-emoji]").forEach((button) => {
    button.addEventListener("click", () => {
      insertEmoji(button.dataset.emoji || "");
      playEmojiPop(button);
    });
  });

  imageInput?.addEventListener("change", handleImageChange);

  removeImageButton?.addEventListener("click", () => {
    clearSelectedImage();
  });
}

async function handleCreateDropSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');

  try {
    setButtonLoading(submitButton, true, "Tomando ubicación...");

    const position = await getCurrentPosition();

    setUserLocation(position);
    setLocationStatus("Ubicación detectada", "ok");

    const formData = new FormData(form);

    const payload = {
      title: String(formData.get("title") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      latitude: position.latitude,
      longitude: position.longitude,
      radiusMeters: Number(formData.get("radiusMeters") || 50),
      durationMinutes: Number(formData.get("durationMinutes") || 1440),
      keyword: String(formData.get("keyword") || "").trim(),
      imageDataUrl: selectedImageDataUrl
    };

    if (!payload.message) {
      showToast("El mensaje no puede estar vacío.", "warning");
      return;
    }

    setButtonLoading(submitButton, true, "Guardando...");

    const result = await createDrop(payload);

    form.reset();
    clearSelectedImage();

    const publicCode = result?.data?.publicCode || result?.publicCode || "sin código";

    showToast(`Drop creado correctamente. Código: ${publicCode}`, "success");
  } catch (error) {
    const geoMessage = formatGeoError(error);
    const apiMessage = error?.payload?.error;

    if (error?.message?.startsWith("GEOLOCATION")) {
      setLocationStatus("Error de ubicación", "error");
      showToast(geoMessage, "danger");
      return;
    }

    showToast(apiMessage || "No se pudo crear el Drop.", "danger");
  } finally {
    setButtonLoading(submitButton, false);
    renderIcons();
  }
}

function insertEmoji(emoji) {
  const textarea = qs("#dropMessage");

  if (!textarea || !emoji) return;

  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const value = textarea.value;

  textarea.value = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
  textarea.focus();

  const nextPosition = start + emoji.length;
  textarea.setSelectionRange(nextPosition, nextPosition);
}

function playEmojiPop(button) {
  if (!button) return;

  button.classList.remove("is-popped");

  window.requestAnimationFrame(() => {
    button.classList.add("is-popped");
  });

  window.setTimeout(() => {
    button.classList.remove("is-popped");
  }, 430);
}

function handleImageChange(event) {
  const file = event.target.files?.[0];

  if (!file) {
    clearSelectedImage();
    return;
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    showToast("Formato no permitido. Usá JPG, PNG o WEBP.", "warning");
    clearSelectedImage();
    return;
  }

  if (file.size > 1.5 * 1024 * 1024) {
    showToast("La imagen es muy pesada. Máximo recomendado: 1.5 MB.", "warning");
    clearSelectedImage();
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    selectedImageDataUrl = String(reader.result || "");
    renderImagePreview(selectedImageDataUrl);
  };

  reader.onerror = () => {
    showToast("No se pudo leer la imagen.", "danger");
    clearSelectedImage();
  };

  reader.readAsDataURL(file);
}

function renderImagePreview(dataUrl) {
  const preview = qs("#dropImagePreview");
  const image = qs("#dropImagePreviewImg");

  if (!preview || !image) return;

  image.src = dataUrl;
  preview.hidden = false;

  renderIcons();
}

function clearSelectedImage() {
  const imageInput = qs("#dropImage");
  const preview = qs("#dropImagePreview");
  const image = qs("#dropImagePreviewImg");

  selectedImageDataUrl = "";

  if (imageInput) {
    imageInput.value = "";
  }

  if (image) {
    image.removeAttribute("src");
  }

  if (preview) {
    preview.hidden = true;
  }

  renderIcons();
}

function handleFormReset() {
  window.setTimeout(() => {
    clearSelectedImage();
  }, 0);
}