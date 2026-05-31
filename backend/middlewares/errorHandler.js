"use strict";

export function notFoundHandler(request, response) {
  response.status(404).json({
    ok: false,
    error: "NOT_FOUND",
    message: "Ruta no encontrada."
  });
}

export function errorHandler(error, request, response, next) {
  console.error("[Hermes Drop Error]", error);

  const statusCode = error.statusCode || error.status || 500;

  response.status(statusCode).json({
    ok: false,
    error: error.code || "INTERNAL_SERVER_ERROR",
    message: error.message || "Error interno del servidor."
  });
}