import pointService from "../services/point-service.js";

async function getMyPoint(req, res, next) {
  try {
    const userId = req.user.id;
    const data = await pointService.getMyPoint(userId);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function createRandomPointDraw(req, res, next) {
  try {
    const userId = req.user.id;
    const data = await pointService.createRandomPointDraw(userId);
    return res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export default {
  getMyPoint,
  createRandomPointDraw,
};
