import AppError from '../errors/app-error.js'
import { ERROR_DEFINITIONS } from '../errors/error-definitions.js'

import {
  findSaleListingById,
  findExchangeOffersBySaleId,
} from '../repositories/exchange-repository.js'

async function getExchangeOffersBySale({ saleId, userId }) {
  const saleListing = await findSaleListingById(saleId)

  if (!saleListing) {
    throw new AppError(ERROR_DEFINITIONS.SALE_NOT_FOUND)
  }

  if (saleListing.sellerId !== BigInt(userId)) {
    throw new AppError(ERROR_DEFINITIONS.FORBIDDEN)
  }

  return findExchangeOffersBySaleId(saleId)
}

export { getExchangeOffersBySale }
