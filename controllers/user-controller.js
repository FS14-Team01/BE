import {
  getMyOwnerships as getMyOwnershipsService,
} from "../services/ownership-service.js";
import { getMyInfo as getMyInfoService } from "../services/user-service.js";

export async function getMyInfo(req, res, next) {
  try {
    const user = await getMyInfoService(req.auth.userId);

    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

export async function getMyOwnerships(req, res, next) {
  try {
    const ownerships = await getMyOwnershipsService(
      req.auth.userId,
      req.query,
    );

    return res.status(200).json(ownerships);
  } catch (error) {
    return next(error);
  }
}
