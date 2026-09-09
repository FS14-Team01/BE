import { getExchangeOffersBySale } from "../services/exchange-service.js";

async function getExchangeOffers(req, res, next) {
  try {
    const { saleId } = req.params;
    const userId = req.user?.id;

    const result = await getExchangeOffersBySale({
      saleId,
      userId,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export { getExchangeOffers };
