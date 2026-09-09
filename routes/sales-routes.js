import { Router } from "express";
import { getExchangeOffers } from "../controllers/exchange-controller.js";
import {
  getSaleDetail,
  stopSale,
  updateSale,
} from "../controllers/sales-controller.js";
import verifyAccessToken from "../middlewares/auth.js";

const salesRouter = Router();

salesRouter.get("/:saleId", verifyAccessToken, getSaleDetail);
salesRouter.patch("/:saleId", verifyAccessToken, updateSale);
salesRouter.post("/:saleId/stop", verifyAccessToken, stopSale);
salesRouter.get("/:saleId/exchange-offers", getExchangeOffers);

export default salesRouter;
