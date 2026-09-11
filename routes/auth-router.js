import { Router } from "express";
import {
  signUp,
  login,
  refreshAccessToken,
} from "../controllers/auth-controller.js";

const authRouter = Router();

authRouter.post("/signup", signUp);
authRouter.post("/login", login);
authRouter.post("/refresh", refreshAccessToken);

export default authRouter;
