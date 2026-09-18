import express from "express";
import {
  drawRandomPoint,
  getMyPoints,
} from "../controllers/point-controller.js";
import verifyAccessToken from "../middlewares/auth.js";

const router = express.Router();

router.get("/me", verifyAccessToken, getMyPoints);
router.post("/random-draws", verifyAccessToken, drawRandomPoint);

export default router;
