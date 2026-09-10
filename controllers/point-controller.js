import {
  createRandomPointDraw,
  getUserPointsStatus,
} from "../services/point-service.js";

async function getMyPoints(req, res, next) {
  try {
    const userId = BigInt(req.auth.userId);
    const data = await getUserPointsStatus(userId);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function drawRandomPoint(req, res, next) {
  try {
    const userId = BigInt(req.auth.userId);
    const data = await createRandomPointDraw(userId);
    return res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export { getMyPoints, drawRandomPoint };
