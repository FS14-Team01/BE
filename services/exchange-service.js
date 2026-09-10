import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";
import {
  findSaleListingById,
  findExchangeOffersBySaleId,
  findExchangeOfferById,
  rejectExchangeOfferById,
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

async function rejectExchangeOffer({ exchangeOfferId, userId }) {
  if (!POSITIVE_INTEGER_PATTERN.test(exchangeOfferId)) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const parsedExchangeOfferId = BigInt(exchangeOfferId);

  if (parsedExchangeOfferId > MAX_DATABASE_BIGINT) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const offeredExchange = await findExchangeOfferById(parsedExchangeOfferId);

  if (!offeredExchange) {
    throw new AppError(ERROR_DEFINITIONS.EXCHANGE_OFFER_NOT_FOUND);
  }

  const saleListing = await findSaleListingById(offeredExchange.saleListingId);

  // DB 무결성이 깨진 비정상 상황 방어
  if (!saleListing) {
    throw new AppError(ERROR_DEFINITIONS.EXCHANGE_OFFER_NOT_FOUND);
  }

  // userId 유효성 검증은 인증 미들웨어에서 공통 처리
  const parsedUserId = BigInt(userId);

  if (parsedUserId !== saleListing.sellerId) {
    throw new AppError(ERROR_DEFINITIONS.EXCHANGE_OFFER_NOT_FOUND);
  }

  if (offeredExchange.status !== "PENDING") {
    throw new AppError(ERROR_DEFINITIONS.EXCHANGE_OFFER_ALREADY_PROCESSED);
  }

  const rejectedExchange = await rejectExchangeOfferById(offeredExchange.id);

  return {
    ...rejectedExchange,
    id: rejectedExchange.id.toString(),
  };
}

export { getExchangeOffersBySale, rejectExchangeOffer };
