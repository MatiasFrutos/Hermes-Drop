"use strict";

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("[Hermes Drop] Falta DATABASE_URL en el archivo .env");
  process.exit(1);
}

export const pool = new Pool({
  connectionString: DATABASE_URL
});

export async function query(text, params = []) {
  const startedAt = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - startedAt;

    if (process.env.NODE_ENV === "development") {
      console.log("[DB]", {
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }

    return result;
  } catch (error) {
    console.error("[DB ERROR]", error.message);
    throw error;
  }
}

export async function testDatabaseConnection() {
  const result = await query("SELECT NOW() AS now;");
  return result.rows[0];
}