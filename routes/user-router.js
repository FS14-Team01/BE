import { Router } from "express";
import {
  getMyInfo,
  getMyOwnerships,
  getMySales,
  getMySalesSummary,
} from "../controllers/user-controller.js";
import verifyAccessToken from "../middlewares/auth.js";
import { getRequesterExchangeOffers } from "../controllers/requester-exchange-controller.js";

const userRouter = Router();

userRouter.get("/me", verifyAccessToken, getMyInfo);
userRouter.get("/me/ownerships", verifyAccessToken, getMyOwnerships);
userRouter.get("/me/sales", verifyAccessToken, getMySales);
userRouter.get("/me/sales/summary", verifyAccessToken, getMySalesSummary);
userRouter.get(
  "/me/exchange-offers",
  verifyAccessToken,
  getRequesterExchangeOffers,
);

export default userRouter;
