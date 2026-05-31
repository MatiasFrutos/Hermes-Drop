"use strict";

import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 10;

export async function hashKeyword(keyword) {
  const normalizedKeyword = normalizeSecret(keyword);

  if (!normalizedKeyword) {
    return null;
  }

  return bcrypt.hash(normalizedKeyword, SALT_ROUNDS);
}

export async function compareKeyword(keyword, hash) {
  const normalizedKeyword = normalizeSecret(keyword);

  if (!normalizedKeyword || !hash) {
    return false;
  }

  return bcrypt.compare(normalizedKeyword, hash);
}

export function hashIp(ip) {
  const secret = process.env.IP_HASH_SECRET || "hermes-drop-local-secret";

  return crypto
    .createHmac("sha256", secret)
    .update(String(ip || "unknown"))
    .digest("hex");
}

export function normalizeSecret(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}