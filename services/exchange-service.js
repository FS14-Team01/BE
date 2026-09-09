import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";
import {
  findSaleListingById,
  findExchangeOffersBySaleId,
} from "../repositories/exchange-repository.js";

// sales-service.js 기준에 맞춤
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const MAX_DATABASE_BIGINT = 9_223_372_036_854_775_807n;

async function getExchangeOffersBySale({ saleId, userId }) {
  if (!POSITIVE_INTEGER_PATTERN.test(saleId)) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const parsedSaleId = BigInt(saleId);

  if (parsedSaleId > MAX_DATABASE_BIGINT) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const saleListing = await findSaleListingById(parsedSaleId);

  if (!saleListing) {
    throw new AppError(ERROR_DEFINITIONS.SALE_NOT_FOUND);
  }

  if (saleListing.sellerId !== BigInt(userId)) {
    throw new AppError(ERROR_DEFINITIONS.FORBIDDEN);
  }

  const exchangeOffers = await findExchangeOffersBySaleId(parsedSaleId);

  return exchangeOffers.map((exchangeOffer) => ({
    ...exchangeOffer,
    id: exchangeOffer.id.toString(),
    saleListing: {
      ...exchangeOffer.saleListing,
      price: exchangeOffer.saleListing.price.toString(),
    },
  }));
}

export { getExchangeOffersBySale };
