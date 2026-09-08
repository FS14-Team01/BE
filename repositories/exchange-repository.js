import prisma from '../config/prisma.js'

async function findSaleListingById(saleId) {
  return prisma.saleListing.findUnique({
    where: { id: BigInt(saleId) },
    select: { id: true, sellerId: true },
  })
}

// 정책 변경으로 PENDING / ACCEPTED / REJECTED / CANCELLED 상태를 구분 없이 함께 조회
async function findExchangeOffersBySaleId(saleId) {
  return prisma.exchange.findMany({
    where: { saleListingId: BigInt(saleId) },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      status: true,
      requester: {
        select: {
          nickname: true,
        },
      },
      offeredCard: {
        select: {
          name: true,
          imageUrl: true,
          grade: true,
          category: true,
          description: true,
        },
      },
      saleListing: {
        select: {
          price: true,
        },
      },
    },
  })
}

export { findSaleListingById, findExchangeOffersBySaleId }
