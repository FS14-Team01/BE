import { Router } from "express";
import { getExchangeOffers } from "../controllers/exchange-controller.js";
import { purchaseSale } from "../controllers/purchase-controller.js";
import {
  createSale,
  getSaleDetail,
  stopSale,
  updateSale,
} from "../controllers/sales-controller.js";
import verifyAccessToken from "../middlewares/auth.js";

const salesRouter = Router();

salesRouter.post("/", verifyAccessToken, createSale);
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
