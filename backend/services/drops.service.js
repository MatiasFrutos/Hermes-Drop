"use strict";

import { query } from "../config/db.js";
import { calculateDistanceMeters, isInsideRadius } from "../utils/distance.js";
import { compareKeyword, hashIp, hashKeyword } from "../utils/hash.js";

export async function createDropService(data, requestIp) {
  const publicCode = await generateUniquePublicCode();
  const keywordHash = await hashKeyword(data.keyword);
  const hasKeyword = Boolean(keywordHash);
  const creatorIpHash = hashIp(requestIp);

  const expiresAt = new Date(Date.now() + data.durationMinutes * 60 * 1000);

  const result = await query(
    `
      INSERT INTO drops (
        public_code,
        title,
        message,
        image_data_url,
        latitude,
        longitude,
        radius_meters,
        keyword_hash,
        has_keyword,
        expires_at,
        creator_ip_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING
        id,
        public_code,
        title,
        latitude,
        longitude,
        radius_meters,
        has_keyword,
        expires_at,
        created_at,
        image_data_url;
    `,
    [
      publicCode,
      data.title || null,
      data.message,
      data.imageDataUrl || null,
      data.latitude,
      data.longitude,
      data.radiusMeters,
      keywordHash,
      hasKeyword,
      expiresAt,
      creatorIpHash
    ]
  );

  const drop = result.rows[0];

  return {
    id: drop.id,
    publicCode: drop.public_code,
    title: drop.title,
    latitude: Number(drop.latitude),
    longitude: Number(drop.longitude),
    radiusMeters: Number(drop.radius_meters),
    hasKeyword: drop.has_keyword,
    hasImage: Boolean(drop.image_data_url),
    expiresAt: drop.expires_at,
    createdAt: drop.created_at
  };
}

export async function getNearbyDropsService(position) {
  const result = await query(
    `
      SELECT
        id,
        public_code,
        title,
        latitude,
        longitude,
        radius_meters,
        has_keyword,
        image_data_url,
        expires_at,
        created_at
      FROM drops
      WHERE is_active = TRUE
        AND is_reported = FALSE
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 300;
    `
  );

  const nearbyDrops = result.rows
    .map((drop) => {
      const distanceMeters = calculateDistanceMeters(
        {
          latitude: position.latitude,
          longitude: position.longitude
        },
        {
          latitude: Number(drop.latitude),
          longitude: Number(drop.longitude)
        }
      );

      return {
        publicCode: drop.public_code,
        title: drop.title || "Drop Hermes",
        latitude: Number(drop.latitude),
        longitude: Number(drop.longitude),
        radiusMeters: Number(drop.radius_meters),
        hasKeyword: drop.has_keyword,
        hasImage: Boolean(drop.image_data_url),
        distanceMeters,
        canUnlock: isInsideRadius(distanceMeters, Number(drop.radius_meters)),
        expiresAt: drop.expires_at,
        createdAt: drop.created_at
      };
    })
    .filter((drop) => drop.canUnlock)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return nearbyDrops;
}

export async function unlockDropService(data) {
  const result = await query(
    `
      SELECT
        id,
        public_code,
        title,
        message,
        image_data_url,
        latitude,
        longitude,
        radius_meters,
        keyword_hash,
        has_keyword,
        expires_at,
        is_active,
        is_reported
      FROM drops
      WHERE public_code = $1
      LIMIT 1;
    `,
    [data.publicCode]
  );

  const drop = result.rows[0];

  if (!drop) {
    const error = new Error("Drop no encontrado.");
    error.statusCode = 404;
    error.code = "DROP_NOT_FOUND";
    throw error;
  }

  if (!drop.is_active || drop.is_reported || new Date(drop.expires_at).getTime() <= Date.now()) {
    const error = new Error("Drop no disponible.");
    error.statusCode = 410;
    error.code = "DROP_NOT_AVAILABLE";
    throw error;
  }

  const distanceMeters = calculateDistanceMeters(
    {
      latitude: data.latitude,
      longitude: data.longitude
    },
    {
      latitude: Number(drop.latitude),
      longitude: Number(drop.longitude)
    }
  );

  const insideRadius = isInsideRadius(distanceMeters, Number(drop.radius_meters));

  if (!insideRadius) {
    const error = new Error("Ubicación fuera de rango.");
    error.statusCode = 403;
    error.code = "LOCATION_OUT_OF_RANGE";
    error.distanceMeters = distanceMeters;
    throw error;
  }

  if (drop.has_keyword) {
    const keywordMatches = await compareKeyword(data.keyword, drop.keyword_hash);

    if (!keywordMatches) {
      const error = new Error("Palabra clave incorrecta.");
      error.statusCode = 403;
      error.code = "INVALID_KEYWORD";
      throw error;
    }
  }

  const unlockedDrop = {
    publicCode: drop.public_code,
    title: drop.title || "Hermes Drop",
    message: drop.message,
    imageDataUrl: drop.image_data_url || "",
    distanceMeters,
    radiusMeters: Number(drop.radius_meters),
    deletedAfterRead: true
  };

  await query(
    `
      DELETE FROM drops
      WHERE id = $1;
    `,
    [drop.id]
  );

  return unlockedDrop;
}

export async function reportDropService(publicCode) {
  const result = await query(
    `
      UPDATE drops
      SET
        report_count = report_count + 1,
        is_reported = CASE
          WHEN report_count + 1 >= 3 THEN TRUE
          ELSE is_reported
        END,
        updated_at = NOW()
      WHERE public_code = $1
      RETURNING public_code, report_count, is_reported;
    `,
    [publicCode]
  );

  if (!result.rows[0]) {
    const error = new Error("Drop no encontrado.");
    error.statusCode = 404;
    error.code = "DROP_NOT_FOUND";
    throw error;
  }

  return {
    publicCode: result.rows[0].public_code,
    reportCount: Number(result.rows[0].report_count),
    isReported: result.rows[0].is_reported
  };
}

export async function deleteExpiredDropsService() {
  const result = await query(
    `
      DELETE FROM drops
      WHERE expires_at <= NOW()
      RETURNING public_code;
    `
  );

  return {
    deletedCount: result.rowCount,
    drops: result.rows.map((row) => row.public_code)
  };
}

async function generateUniquePublicCode() {
  let attempts = 0;

  while (attempts < 10) {
    const publicCode = `HD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const result = await query(
      `
        SELECT public_code
        FROM drops
        WHERE public_code = $1
        LIMIT 1;
      `,
      [publicCode]
    );

    if (!result.rows.length) {
      return publicCode;
    }

    attempts += 1;
  }

  const error = new Error("No se pudo generar un código único.");
  error.statusCode = 500;
  error.code = "PUBLIC_CODE_GENERATION_FAILED";
  throw error;
}