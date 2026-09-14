import { Router } from "express";
import {
  signUp,
  login,
  refreshAccessToken,
  logout,
} from "../controllers/auth-controller.js";
import verifyAccessToken from "../middlewares/auth.js";

const authRouter = Router();

authRouter.post("/signup", signUp);
authRouter.post("/login", login);
authRouter.post("/refresh", refreshAccessToken);
authRouter.post("/logout", verifyAccessToken, logout);

export default authRouter;
