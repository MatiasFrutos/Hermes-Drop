"use strict";

let lastKnownPosition = null;

export function isGeolocationSupported() {
  return "geolocation" in navigator;
}

export function getLastKnownPosition() {
  return lastKnownPosition;
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error("GEOLOCATION_NOT_SUPPORTED"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        lastKnownPosition = coords;
        resolve(coords);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("GEOLOCATION_PERMISSION_DENIED"));
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          reject(new Error("GEOLOCATION_POSITION_UNAVAILABLE"));
          return;
        }

        if (error.code === error.TIMEOUT) {
          reject(new Error("GEOLOCATION_TIMEOUT"));
          return;
        }

        reject(new Error("GEOLOCATION_ERROR"));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  });
}

export function formatGeoError(error) {
  const code = error?.message || "GEOLOCATION_ERROR";

  const messages = {
    GEOLOCATION_NOT_SUPPORTED: "Tu navegador no soporta geolocalización.",
    GEOLOCATION_PERMISSION_DENIED: "Permiso de ubicación denegado. Sin ubicación, Hermes se queda sin sandalias.",
    GEOLOCATION_POSITION_UNAVAILABLE: "No se pudo obtener tu ubicación actual.",
    GEOLOCATION_TIMEOUT: "La ubicación tardó demasiado en responder.",
    GEOLOCATION_ERROR: "No se pudo obtener la ubicación."
  };

  return messages[code] || messages.GEOLOCATION_ERROR;
}