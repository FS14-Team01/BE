import express from "express";
import notificationController from "../controllers/notification-controller.js";
import verifyAccessToken from "../middlewares/auth.js";

const router = express.Router();

router.get("/", verifyAccessToken, notificationController.getNotifications);
router.patch(
  "/read-all",
  verifyAccessToken,
  notificationController.markAllAsRead,
);

export default router;
