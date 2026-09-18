import { getMarketSummary } from "../services/market-summary-service.js";

export async function getSalesSummary(req, res, next) {
  try {
    return res.status(200).json(await getMarketSummary(req.query));
  } catch (error) {
    return next(error);
  }
}
