import { Router } from "express";
import {
  getMyInfo,
  getMyOwnerships,
} from "../controllers/user-controller.js";
import verifyAccessToken from "../middlewares/auth.js";

const userRouter = Router();

userRouter.get("/me", verifyAccessToken, getMyInfo);
userRouter.get("/me/ownerships", verifyAccessToken, getMyOwnerships);

export default userRouter;
