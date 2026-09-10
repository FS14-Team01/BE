import { Router } from "express";
import { getMyInfo } from "../controllers/user-controller.js";
import verifyAccessToken from "../middlewares/auth.js";

const userRouter = Router();

userRouter.get("/me", verifyAccessToken, getMyInfo);

export default userRouter;
