import { Router } from "express";
import { getSalesSummary } from "../controllers/market-summary-controller.js";
import { getExchangeOffers } from "../controllers/seller-exchange-controller.js";
import { purchaseSale } from "../controllers/purchase-controller.js";
import {
  createSale,
  getSaleDetail,
  getSales,
  stopSale,
  updateSale,
} from "../controllers/sales-controller.js";
import verifyAccessToken from "../middlewares/auth.js";
import { postExchangeOffer } from "../controllers/create-exchange-controller.js";

const salesRouter = Router();

salesRouter.get("/", getSales);
salesRouter.get("/summary", getSalesSummary);
salesRouter.post("/", verifyAccessToken, createSale);
salesRouter.post(
  "/:saleId/exchange-offers",
  verifyAccessToken,
  postExchangeOffer,
);
salesRouter.get(
  "/:saleId/exchange-offers",
  verifyAccessToken,
  getExchangeOffers,
);
salesRouter.get("/:saleId", verifyAccessToken, getSaleDetail);
salesRouter.patch("/:saleId", verifyAccessToken, updateSale);
salesRouter.post("/:saleId/stop", verifyAccessToken, stopSale);
salesRouter.post("/:saleId/purchases", verifyAccessToken, purchaseSale);

export default salesRouter;
