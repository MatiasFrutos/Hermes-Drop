"use strict";

import {
  createDropService,
  deleteExpiredDropsService,
  getNearbyDropsService,
  reportDropService,
  unlockDropService
} from "../services/drops.service.js";

import {
  validateCreateDropPayload,
  validateNearbyPayload,
  validateReportPayload,
  validateUnlockPayload
} from "../utils/validators.js";

import { getRequestIp } from "../middlewares/rateLimit.js";

export async function createDropController(request, response, next) {
  try {
    const validation = validateCreateDropPayload(request.body);

    if (!validation.isValid) {
      return response.status(400).json({
        ok: false,
        error: "VALIDATION_ERROR",
        messages: validation.errors
      });
    }

    const requestIp = getRequestIp(request);
    const drop = await createDropService(validation.data, requestIp);

    response.status(201).json({
      ok: true,
      message: "Drop creado correctamente.",
      data: drop
    });
  } catch (error) {
    next(error);
  }
}

export async function getNearbyDropsController(request, response, next) {
  try {
    const validation = validateNearbyPayload(request.query);

    if (!validation.isValid) {
      return response.status(400).json({
        ok: false,
        error: "VALIDATION_ERROR",
        messages: validation.errors
      });
    }

    const drops = await getNearbyDropsService(validation.data);

    response.json({
      ok: true,
      message: "Drops cercanos obtenidos correctamente.",
      data: drops
    });
  } catch (error) {
    next(error);
  }
}

export async function unlockDropController(request, response, next) {
  try {
    const validation = validateUnlockPayload(request.body);

    if (!validation.isValid) {
      return response.status(400).json({
        ok: false,
        error: "VALIDATION_ERROR",
        messages: validation.errors
      });
    }

    const unlockedDrop = await unlockDropService(validation.data);

    response.json({
      ok: true,
      message: "Drop desbloqueado correctamente.",
      data: unlockedDrop
    });
  } catch (error) {
    if (error.code === "LOCATION_OUT_OF_RANGE") {
      return response.status(error.statusCode || 403).json({
        ok: false,
        error: error.code,
        message: error.message,
        distanceMeters: error.distanceMeters
      });
    }

    next(error);
  }
}

export async function reportDropController(request, response, next) {
  try {
    const validation = validateReportPayload(request.body);

    if (!validation.isValid) {
      return response.status(400).json({
        ok: false,
        error: "VALIDATION_ERROR",
        messages: validation.errors
      });
    }

    const result = await reportDropService(validation.data.publicCode);

    response.json({
      ok: true,
      message: "Drop reportado correctamente.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteExpiredDropsController(request, response, next) {
  try {
    const result = await deleteExpiredDropsService();

    response.json({
      ok: true,
      message: "Drops expirados desactivados correctamente.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}