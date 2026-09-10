import {
  getUserNotifications,
  markNotificationsAsRead,
} from "../services/notification-service.js";

async function getNotifications(req, res, next) {
  try {
    const userId = BigInt(req.auth.userId);
    const notifications = await getUserNotifications(userId, req.query);
    return res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const userId = BigInt(req.auth.userId);
    const result = await markNotificationsAsRead(userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export default {
  getNotifications,
  markAllAsRead,
};
