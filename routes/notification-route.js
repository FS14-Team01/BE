import express from 'express';
import notificationController from '../controllers/notification-controller.js';

const router = express.Router();

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead);

export default router;