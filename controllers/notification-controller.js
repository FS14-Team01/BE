import notificationService from '../services/notification-service.js';

async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const notifications = await notificationService.getNotifications(userId, req.query);
    return res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await notificationService.markAllAsRead(userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export default {
  getNotifications,
  markAllAsRead,
}
