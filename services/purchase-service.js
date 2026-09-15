import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";
import {
  createPointTransactions,
  createPurchase,
  createSellerNotifications,
  decreaseRemainingQuantity,
  decreaseUserPoints,
  findSaleForPurchaseById,
  findUserPoints,
  increaseBuyerOwnership,
  increaseUserPoints,
  markSaleAsSoldOut,
  runPurchaseTransaction,
} from "../repositories/purchase-repository.js";

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const MAX_DATABASE_BIGINT = 9_223_372_036_854_775_807n;

function parseDatabaseId(value, errorDefinition) {
  if (typeof value !== "string" || !POSITIVE_INTEGER_PATTERN.test(value)) {
    throw new AppError(errorDefinition);
  }

  const parsedValue = BigInt(value);

  if (parsedValue > MAX_DATABASE_BIGINT) {
    throw new AppError(errorDefinition);
  }

  return parsedValue;
}

function parseQuantity(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const { quantity } = body;

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_PURCHASE_QUANTITY);
  }

  return quantity;
}

function assertPurchasable(sale, buyerId) {
  if (!sale) {
    throw new AppError(ERROR_DEFINITIONS.SALE_NOT_FOUND);
  }

  if (sale.sellerId === buyerId) {
    throw new AppError(ERROR_DEFINITIONS.CANNOT_PURCHASE_OWN_SALE);
  }

  if (sale.status === "CANCELLED") {
    throw new AppError(ERROR_DEFINITIONS.SALE_CANCELLED);
  }

  if (sale.status === "SOLD_OUT") {
    throw new AppError(ERROR_DEFINITIONS.SALE_SOLD_OUT);
  }
}

function serializePurchase(purchase) {
  return {
    id: purchase.id.toString(),
    saleListingId: purchase.saleListingId.toString(),
    buyerId: purchase.buyerId.toString(),
    quantity: purchase.quantity,
    pricePerCard: purchase.pricePerCard,
    totalPrice: purchase.totalPrice,
    createdAt: purchase.createdAt,
  };
}

function serializeOwnership(ownership) {
  return {
    id: ownership.id.toString(),
    ownerId: ownership.ownerId.toString(),
    photoCardId: ownership.photoCardId.toString(),
    quantity: ownership.quantity,
    createdAt: ownership.createdAt,
    updatedAt: ownership.updatedAt,
  };
}

async function purchaseSaleById(saleIdParam, buyerIdFromToken, body) {
  const saleId = parseDatabaseId(saleIdParam, ERROR_DEFINITIONS.SALE_NOT_FOUND);
  const buyerId = parseDatabaseId(
    buyerIdFromToken,
    ERROR_DEFINITIONS.UNAUTHORIZED,
  );
  const quantity = parseQuantity(body);

  return runPurchaseTransaction(async (tx) => {
    const sale = await findSaleForPurchaseById(tx, saleId);

    assertPurchasable(sale, buyerId);

    const totalPrice = sale.price * quantity;
    const buyer = await findUserPoints(tx, buyerId);

    if (!buyer) {
      throw new AppError(ERROR_DEFINITIONS.UNAUTHORIZED);
    }

    if (buyer.points < totalPrice) {
      throw new AppError(ERROR_DEFINITIONS.INSUFFICIENT_POINTS);
    }

    // 조건부 차감이라 재고가 모자라면 갱신 건수가 0으로 돌아온다
    const stockResult = await decreaseRemainingQuantity(tx, saleId, quantity);

    if (stockResult.count === 0) {
      throw new AppError(ERROR_DEFINITIONS.INSUFFICIENT_SALE_QUANTITY);
    }

    // 0P 나눔은 포인트 이동이 없어 갱신 자체를 건너뛴다
    if (totalPrice > 0) {
      const pointResult = await decreaseUserPoints(tx, buyerId, totalPrice);

      if (pointResult.count === 0) {
        throw new AppError(ERROR_DEFINITIONS.INSUFFICIENT_POINTS);
      }

      await increaseUserPoints(tx, sale.sellerId, totalPrice);

      await createPointTransactions(tx, [
        { userId: buyerId, type: "PURCHASE", amount: totalPrice },
        { userId: sale.sellerId, type: "SALE", amount: totalPrice },
      ]);
    }

    const ownership = await increaseBuyerOwnership(
      tx,
      buyerId,
      sale.photoCardId,
      quantity,
    );

    const purchase = await createPurchase(tx, {
      saleListingId: saleId,
      buyerId,
      quantity,
      pricePerCard: sale.price,
      totalPrice,
    });

    const remainingQuantity = sale.remainingQuantity - quantity;
    const notifications = [
      {
        userId: sale.sellerId,
        type: "CARD_SOLD",
        relatedPurchaseId: purchase.id,
      },
    ];

    if (remainingQuantity === 0) {
      await markSaleAsSoldOut(tx, saleId);

      notifications.push({
        userId: sale.sellerId,
        type: "CARD_SOLD_OUT",
        relatedSaleListingId: saleId,
      });
    }

    await createSellerNotifications(tx, notifications);

    const updatedBuyer = await findUserPoints(tx, buyerId);

    return {
      purchase: serializePurchase(purchase),
      ownership: serializeOwnership(ownership),
      remainingQuantity,
      points: updatedBuyer.points,
    };
  });
}

export { purchaseSaleById };
