import {
  findSaleListingById,
  findExchangeOffersBySaleId,
} from '../repositories/exchange-repository.js'

async function getExchangeOffersBySale({ saleId, userId }) {
  const saleListing = await findSaleListingById(saleId)

  if (!saleListing) {
    throw new Error('판매 정보를 찾을 수 없습니다.')
  }

  if (saleListing.sellerId !== BigInt(userId)) {
    throw new Error('교환 제안 목록을 조회할 권한이 없습니다.')
  }

  return findExchangeOffersBySaleId(saleId)
}

export { getExchangeOffersBySale }
