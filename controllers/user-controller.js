import { getMyInfo as getMyInfoService } from "../services/user-service.js";

export async function getMyInfo(req, res, next) {
  try {
    const user = await getMyInfoService(req.auth.userId);

    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}
