"use strict";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_TITLE_LENGTH = 80;
const MAX_KEYWORD_LENGTH = 80;
const MAX_IMAGE_DATA_URL_LENGTH = 2_200_000;

export function validateCreateDropPayload(payload) {
  const errors = [];

  const title = cleanString(payload.title);
  const message = cleanString(payload.message);
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  const radiusMeters = Number(payload.radiusMeters || 50);
  const durationMinutes = Number(payload.durationMinutes || 1440);
  const keyword = cleanString(payload.keyword);
  const imageDataUrl = cleanString(payload.imageDataUrl);

  const maxRadiusMeters = Number(process.env.DROP_MAX_RADIUS_METERS || 500);
  const maxDurationMinutes = Number(process.env.DROP_MAX_DURATION_MINUTES || 10080);

  if (title.length > MAX_TITLE_LENGTH) {
    errors.push("El título no puede superar los 80 caracteres.");
  }

  if (!message) {
    errors.push("El mensaje es obligatorio.");
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    errors.push("El mensaje no puede superar los 1000 caracteres.");
  }

  if (!isValidLatitude(latitude)) {
    errors.push("Latitud inválida.");
  }

  if (!isValidLongitude(longitude)) {
    errors.push("Longitud inválida.");
  }

  if (!Number.isInteger(radiusMeters) || radiusMeters < 10 || radiusMeters > maxRadiusMeters) {
    errors.push(`El rango debe estar entre 10 y ${maxRadiusMeters} metros.`);
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > maxDurationMinutes) {
    errors.push(`La duración debe estar entre 1 y ${maxDurationMinutes} minutos.`);
  }

  if (keyword.length > MAX_KEYWORD_LENGTH) {
    errors.push("La palabra clave no puede superar los 80 caracteres.");
  }

  if (imageDataUrl && !isValidImageDataUrl(imageDataUrl)) {
    errors.push("La imagen debe ser JPG, PNG o WEBP en formato válido.");
  }

  if (imageDataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
    errors.push("La imagen es demasiado pesada.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      title,
      message,
      latitude,
      longitude,
      radiusMeters,
      durationMinutes,
      keyword,
      imageDataUrl
    }
  };
}

export function validateNearbyPayload(query) {
  const latitude = Number(query.lat);
  const longitude = Number(query.lng);

  const errors = [];

  if (!isValidLatitude(latitude)) {
    errors.push("Latitud inválida.");
  }

  if (!isValidLongitude(longitude)) {
    errors.push("Longitud inválida.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      latitude,
      longitude
    }
  };
}

export function validateUnlockPayload(payload) {
  const publicCode = cleanString(payload.publicCode);
  const keyword = cleanString(payload.keyword);
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);

  const errors = [];

  if (!publicCode) {
    errors.push("El código público es obligatorio.");
  }

  if (!isValidLatitude(latitude)) {
    errors.push("Latitud inválida.");
  }

  if (!isValidLongitude(longitude)) {
    errors.push("Longitud inválida.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      publicCode,
      keyword,
      latitude,
      longitude
    }
  };
}

export function validateReportPayload(payload) {
  const publicCode = cleanString(payload.publicCode);

  const errors = [];

  if (!publicCode) {
    errors.push("El código público es obligatorio.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      publicCode
    }
  };
}

export function isValidLatitude(value) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function cleanString(value) {
  return String(value || "").trim();
}

function isValidImageDataUrl(value) {
  return /^data:image\/(png|jpeg|jpg|webp);base64,[a-zA-Z0-9+/=]+$/.test(value);
}