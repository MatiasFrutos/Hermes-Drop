"use strict";

const API_BASE_URL = "http://localhost:3000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({
    ok: false,
    error: "INVALID_JSON_RESPONSE"
  }));

  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.error || "REQUEST_ERROR");
    error.payload = payload;
    error.status = response.status;
    throw error;
  }

  return payload;
}

export async function createDrop(data) {
  return request("/drops", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function getNearbyDrops(latitude, longitude) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude)
  });

  return request(`/drops/nearby?${params.toString()}`);
}

export async function unlockDrop(data) {
  return request("/drops/unlock", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function reportDrop(publicCode) {
  return request("/drops/report", {
    method: "POST",
    body: JSON.stringify({ publicCode })
  });
}