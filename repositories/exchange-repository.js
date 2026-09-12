import prisma from "../config/prisma.js";

async function findSaleListingById(saleId, db = prisma) {
  return db.saleListing.findUnique({
    where: { id: saleId },
    select: {
      id: true,
      sellerId: true,
      photoCardId: true,
      remainingQuantity: true,
      status: true,
    },
  });
}

// 정책 변경으로 PENDING / ACCEPTED / REJECTED / CANCELLED 상태를 구분 없이 함께 조회
async function findExchangeOffersBySaleId(saleId, { cursor, take }) {
  return prisma.exchange.findMany({
    where: { saleListingId: saleId },
    take,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
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

async function findExchangeOfferById(exchangeOfferId, db = prisma) {
  return db.exchange.findUnique({
    where: { id: exchangeOfferId },
    select: {
      id: true,
      status: true,
      requesterId: true,
      offeredCardId: true,
      saleListingId: true,
    },
  });
}

async function rejectExchangeOfferById(exchangeOfferId) {
  return prisma.exchange.update({
    where: { id: exchangeOfferId },
    data: {
      status: "REJECTED",
      resolvedAt: new Date(),
    },
    select: {
      id: true,
      saleListingId: true,
      status: true,
      resolvedAt: true,
    },
  });
}

async function findOwnershipByOwnerAndCard(ownerId, photoCardId, db = prisma) {
  return db.ownership.findUnique({
    // @@unique([ownerId, photoCardId]) → Prisma 복합 unique 키: ownerId_photoCardId
    where: { ownerId_photoCardId: { ownerId, photoCardId } },
    select: {
      id: true,
      quantity: true,
    },
  });
}

async function decreaseOwnershipQuantity(ownership, db = prisma) {
  // 'ownership.quantity === 0'이 되면 ownership 행 삭제
  if (ownership.quantity === 1) {
    return db.ownership.delete({
      where: { id: ownership.id },
    });
  }

  return db.ownership.update({
    where: { id: ownership.id },
    data: { quantity: { decrement: 1 } },
  });
}

async function increaseOwnershipQuantity(ownerId, photoCardId, db = prisma) {
  return db.ownership.upsert({
    where: { ownerId_photoCardId: { ownerId, photoCardId } },
    update: { quantity: { increment: 1 } },
    create: {
      ownerId,
      photoCardId,
      quantity: 1,
    },
  });
}

async function decreaseSaleListingQuantity(saleListing, db = prisma) {
  // 포토카드는 1장씩만 교환 가능
  const remainingQuantityAfterExchange = saleListing.remainingQuantity - 1;

  return db.saleListing.update({
    where: { id: saleListing.id },
    data: {
      remainingQuantity: remainingQuantityAfterExchange,
      status: remainingQuantityAfterExchange === 0 ? "SOLD_OUT" : "ON_SALE",
    },
  });
}

async function acceptExchangeOfferById(exchangeOfferId, db = prisma) {
  return db.exchange.update({
    where: { id: exchangeOfferId },
    data: {
      status: "ACCEPTED",
      resolvedAt: new Date(),
    },
    select: {
      id: true,
      status: true,
      resolvedAt: true,
    },
  });
}

async function rejectOtherPendingExchangeOffersBySaleId(
  saleListingId,
  acceptedExchangeOfferId,
  db = prisma,
) {
  return db.exchange.updateMany({
    where: {
      saleListingId,
      status: "PENDING",
      id: { not: acceptedExchangeOfferId },
    },
    data: {
      status: "REJECTED",
      resolvedAt: new Date(),
    },
  });
}

export {
  findSaleListingById,
  findExchangeOffersBySaleId,
  findExchangeOfferById,
  rejectExchangeOfferById,
  findOwnershipByOwnerAndCard,
  decreaseOwnershipQuantity,
  increaseOwnershipQuantity,
  decreaseSaleListingQuantity,
  acceptExchangeOfferById,
  rejectOtherPendingExchangeOffersBySaleId,
};
