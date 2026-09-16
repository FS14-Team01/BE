import { Router } from "express";
import verifyAccessToken from "../middlewares/auth.js";
import { updateExchangeOfferStatus } from "../controllers/seller-exchange-controller.js";
import { cancelRequesterExchange } from "../controllers/requester-exchange-controller.js";

const exchangeRouter = Router();

exchangeRouter.patch(
  "/:exchangeOfferId",
  verifyAccessToken,
  cancelRequesterExchange,
  updateExchangeOfferStatus,
);

export default exchangeRouter;
