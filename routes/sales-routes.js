import { Router } from "express";
import { getExchangeOffers } from "../controllers/exchange-controller.js";
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

export default salesRouter;
