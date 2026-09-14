import { Router } from "express";
import verifyAccessToken from "../middlewares/auth.js";
import { updateExchangeOfferStatus } from "../controllers/exchange-controller.js";

const exchangeRouter = Router();

exchangeRouter.patch(
  "/:exchangeOfferId",
  verifyAccessToken,
  updateExchangeOfferStatus,
);

export default exchangeRouter;
