import prisma from "../config/prisma.js";

const PURCHASE_SALE_SELECT = {
  id: true,
  sellerId: true,
  photoCardId: true,
  price: true,
  remainingQuantity: true,
  status: true,
};

export function runPurchaseTransaction(callback) {
  return prisma.$transaction(callback, {
    isolationLevel: "Serializable",
  });
}

export function findSaleForPurchaseById(database, saleId) {
  return database.saleListing.findUnique({
    where: { id: saleId },
    select: PURCHASE_SALE_SELECT,
  });
}

export function findUserPoints(database, userId) {
  return database.user.findUnique({
    where: { id: userId },
    select: { id: true, points: true },
  });
}

/** 조건을 걸어 한 번에 차감해야 재고를 초과해 팔리지 않는다 */
export function decreaseRemainingQuantity(database, saleId, quantity) {
  return database.saleListing.updateMany({
    where: {
      id: saleId,
      status: "ON_SALE",
      remainingQuantity: { gte: quantity },
    },
    data: {
      remainingQuantity: { decrement: quantity },
    },
  });
}

export function markSaleAsSoldOut(database, saleId) {
  return database.saleListing.updateMany({
    where: { id: saleId, remainingQuantity: 0 },
    data: { status: "SOLD_OUT" },
  });
}

/** 잔액이 모자라면 갱신 건수가 0이라 호출부에서 실패로 처리한다 */
export function decreaseUserPoints(database, userId, amount) {
  return database.user.updateMany({
    where: { id: userId, points: { gte: amount } },
    data: { points: { decrement: amount } },
  });
}

export function increaseUserPoints(database, userId, amount) {
  return database.user.update({
    where: { id: userId },
    data: { points: { increment: amount } },
    select: { id: true, points: true },
  });
}

export function increaseBuyerOwnership(database, buyerId, photoCardId, quantity) {
  return database.ownership.upsert({
    where: {
      ownerId_photoCardId: { ownerId: buyerId, photoCardId },
    },
    update: {
      quantity: { increment: quantity },
    },
    create: {
      ownerId: buyerId,
      photoCardId,
      quantity,
    },
    select: {
      id: true,
      ownerId: true,
      photoCardId: true,
      quantity: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export function createPurchase(database, purchaseData) {
  return database.purchase.create({
    data: purchaseData,
    select: {
      id: true,
      saleListingId: true,
      buyerId: true,
      quantity: true,
      pricePerCard: true,
      totalPrice: true,
      createdAt: true,
    },
  });
}

export function createPointTransactions(database, transactions) {
  return database.pointTransaction.createMany({ data: transactions });
}

export function createSellerNotifications(database, notifications) {
  return database.notification.createMany({ data: notifications });
}
