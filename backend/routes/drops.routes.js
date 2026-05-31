"use strict";

import { Router } from "express";

import {
  createDropController,
  deleteExpiredDropsController,
  getNearbyDropsController,
  reportDropController,
  unlockDropController
} from "../controllers/drops.controller.js";

import { createDropRateLimit } from "../middlewares/rateLimit.js";

const router = Router();

router.post("/", createDropRateLimit, createDropController);

router.get("/nearby", getNearbyDropsController);

router.post("/unlock", unlockDropController);

router.post("/report", reportDropController);

router.delete("/expired", deleteExpiredDropsController);

export default router;