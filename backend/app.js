"use strict";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import dropsRoutes from "./routes/drops.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const frontendDir = path.join(rootDir, "frontend");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(
  cors({
    origin: true,
    credentials: false
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(express.static(frontendDir));

app.get("/api", (request, response) => {
  response.json({
    ok: true,
    message: "Hermes Drop API operativa.",
    data: {
      service: "Hermes Drop",
      mode: "local",
      auth: "none",
      version: "0.1.0"
    }
  });
});

app.use("/api/drops", dropsRoutes);

app.get("*", (request, response) => {
  response.sendFile(path.join(frontendDir, "index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;