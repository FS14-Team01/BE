import { Router } from "express";
import { getSaleDetail } from "../controllers/sales-controller.js";
import { getExchangeOffers } from "../controllers/exchange-controller.js";

const salesRouter = Router();

salesRouter.get("/:saleId/exchange-offers", getExchangeOffers);
salesRouter.get("/:saleId", getSaleDetail);

export default salesRouter;
