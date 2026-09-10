import prisma from "../config/prisma.js";

async function findSaleListingById(saleId) {
  return prisma.saleListing.findUnique({
    where: { id: saleId },
    select: { id: true, sellerId: true },
  });
}

// 정책 변경으로 PENDING / ACCEPTED / REJECTED / CANCELLED 상태를 구분 없이 함께 조회
async function findExchangeOffersBySaleId(saleId) {
  return prisma.exchange.findMany({
    where: { saleListingId: saleId },
    orderBy: { createdAt: "asc" },
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
  });
}

async function findExchangeOfferById(exchangeOfferId) {
  return prisma.exchange.findUnique({
    where: { id: exchangeOfferId },
    select: {
      id: true,
      status: true,
      requesterId: true,
      saleListingId: true,
    },
  });
}

async function rejectExchangeOfferById(exchangeOfferId) {
  return prisma.exchange.update({
    where: { id: exchangeOfferId },
    data: { status: "REJECTED", resolvedAt: new Date() },
    select: {
      id: true,
      status: true,
      resolvedAt: true,
    },
  });
}

export {
  findSaleListingById,
  findExchangeOffersBySaleId,
  findExchangeOfferById,
  rejectExchangeOfferById,
};
