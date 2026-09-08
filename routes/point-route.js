import express from "express";
import pointController from "../controllers/point-controller.js";

const router = express.Router();

// 실제 인증 미들웨어 연결 전 테스트용 - 삭제 예정
function mockAuth(req, res, next) {
  req.user = {
    id: 1n,
  };

  next();
}
router.use(mockAuth);

router.get("/me", pointController.getMyPoint);
router.post("/random-draws", pointController.createRandomPointDraw);

export default router;
