export function findPendingExchangeOffers(database, saleId) {
  return database.exchange.findMany({
    where: {
      saleListingId: saleId,
      status: "PENDING",
    },
    select: {
      id: true,
      requesterId: true,
    },
  });
}

export function cancelPendingExchangeOffers(database, saleId, resolvedAt) {
  return database.exchange.updateMany({
    where: {
      saleListingId: saleId,
      status: "PENDING",
    },
    data: {
      status: "CANCELLED",
      resolvedAt,
    },
  });
}

export function createExchangeRejectedNotifications(database, exchangeOffers) {
  if (exchangeOffers.length === 0) return null;

  return database.notification.createMany({
    data: exchangeOffers.map((exchangeOffer) => ({
      userId: exchangeOffer.requesterId,
      type: "EXCHANGE_REJECTED",
      relatedExchangeId: exchangeOffer.id,
    })),
  });
}
