import { Router } from "express";
import {
  createSale,
  getSaleDetail,
} from "../controllers/sales-controller.js";
import { getExchangeOffers } from "../controllers/exchange-controller.js";
import verifyAccessToken from "../middlewares/auth.js";

const salesRouter = Router();

salesRouter.post("/", verifyAccessToken, createSale);
salesRouter.get(
  "/:saleId/exchange-offers",
  verifyAccessToken,
  getExchangeOffers,
);
salesRouter.get("/:saleId", getSaleDetail);

export default salesRouter;
