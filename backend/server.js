"use strict";

import dotenv from "dotenv";

import app from "./app.js";
import { testDatabaseConnection } from "./config/db.js";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

async function bootstrap() {
  try {
    const dbStatus = await testDatabaseConnection();

    console.log("[Hermes Drop] Base de datos conectada:", dbStatus.now);

    app.listen(PORT, () => {
      console.log("====================================================");
      console.log("Hermes Drop operativo");
      console.log(`Frontend: http://localhost:${PORT}`);
      console.log(`API:      http://localhost:${PORT}/api`);
      console.log("====================================================");
    });
  } catch (error) {
    console.error("[Hermes Drop] No se pudo iniciar el servidor.");
    console.error(error.message);
    process.exit(1);
  }
}

bootstrap();