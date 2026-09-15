import { Router } from "express";
import {
  getMyInfo,
  getMyOwnerships,
  getMySales,
  getMySalesSummary,
} from "../controllers/user-controller.js";
import verifyAccessToken from "../middlewares/auth.js";

const userRouter = Router();

userRouter.get("/me", verifyAccessToken, getMyInfo);
userRouter.get("/me/ownerships", verifyAccessToken, getMyOwnerships);
userRouter.get("/me/sales", verifyAccessToken, getMySales);
userRouter.get("/me/sales/summary", verifyAccessToken, getMySalesSummary);

export default userRouter;
