import {
  acceptExchangeOffer,
  getExchangeOffersBySale,
  rejectExchangeOffer,
} from "../services/exchange-service.js";
import { validateExchangeStatus } from "../validator/exchange-validator.js";

async function getExchangeOffers(req, res, next) {
  try {
    const { saleId } = req.params;
    const userId = req.auth.userId;

    const result = await getExchangeOffersBySale({
      saleId,
      userId,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateExchangeOfferStatus(req, res, next) {
  try {
    const { exchangeOfferId } = req.params;
    const { status } = req.body;
    const userId = req.auth.userId;

    validateExchangeStatus(status);

    if (status === "REJECTED") {
      const result = await rejectExchangeOffer({ exchangeOfferId, userId });

      return res.status(200).json(result);
    }

    if (status === "ACCEPTED") {
      const result = await acceptExchangeOffer({ exchangeOfferId, userId });

      return res.status(200).json(result);
    }
  } catch (error) {
    next(error);
  }
}

export { getExchangeOffers, updateExchangeOfferStatus };
