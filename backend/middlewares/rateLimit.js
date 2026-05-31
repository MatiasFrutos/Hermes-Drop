"use strict";

const memoryStore = new Map();

export function createDropRateLimit(request, response, next) {
  const limitPerHour = Number(process.env.DROP_CREATE_LIMIT_PER_HOUR || 20);
  const windowMs = 60 * 60 * 1000;

  const ip = getRequestIp(request);
  const now = Date.now();

  const current = memoryStore.get(ip) || {
    count: 0,
    resetAt: now + windowMs
  };

  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }

  current.count += 1;

  memoryStore.set(ip, current);

  if (current.count > limitPerHour) {
    return response.status(429).json({
      ok: false,
      error: "RATE_LIMIT_EXCEEDED",
      message: "Se superó el límite de creación de Drops por hora."
    });
  }

  next();
}

export function getRequestIp(request) {
  const forwardedFor = request.headers["x-forwarded-for"];

  if (forwardedFor) {
    return String(forwardedFor).split(",")[0].trim();
  }

  return request.ip || request.socket?.remoteAddress || "unknown";
}