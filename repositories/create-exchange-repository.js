export function findPendingOfferForSale(
  { requesterId, offeredCardId, saleListingId },
  db,
) {
  return db.exchange.findFirst({
    where: { requesterId, offeredCardId, saleListingId, status: "PENDING" },
    select: { id: true },
  });
}

export function countPendingOffers(requesterId, offeredCardId, db) {
  // 다른 판매글에 보낸 제안도 같은 보유 카드의 수량에 포함한다.
  return db.exchange.count({
    where: { requesterId, offeredCardId, status: "PENDING" },
  });
}

export async function insertExchangeOfferWithNotification(data, sellerId, db) {
  const exchangeOffer = await db.exchange.create({ data });
  await db.notification.create({
    data: {
      userId: sellerId,
      type: "EXCHANGE_OFFER_RECEIVED",
      relatedSaleListingId: data.saleListingId,
      relatedExchangeId: exchangeOffer.id,
    },
  });
  return exchangeOffer;
}
