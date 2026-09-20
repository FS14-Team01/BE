import prisma from "../config/prisma.js";
import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";
import { formatToKst } from "../utils/kst-time.js";
import { validateCreateExchangeOffer } from "../validator/create-exchange-validator.js";
import {
  findOwnershipByOwnerAndCard,
  findSaleListingById,
} from "../repositories/exchange-repository.js";
import {
  countPendingOffers,
  findPendingOfferForSale,
  insertExchangeOfferWithNotification,
} from "../repositories/create-exchange-repository.js";

export async function createExchangeOffer({ saleId, userId, body }) {
  const input = validateCreateExchangeOffer(saleId, body);
  // 인증 미들웨어에서 검증한 토큰의 ID만 사용한다.
  const requesterId = BigInt(userId);

  const offer = await prisma.$transaction(
    async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: requesterId },
        select: { id: true },
      });
      if (!user) throw new AppError(ERROR_DEFINITIONS.UNAUTHORIZED);

      const sale = await findSaleListingById(input.saleListingId, tx);
      if (!sale) throw new AppError(ERROR_DEFINITIONS.SALE_NOT_FOUND);
      if (sale.sellerId === requesterId) {
        throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
      }
      if (sale.status === "CANCELLED") {
        throw new AppError(ERROR_DEFINITIONS.SALE_CANCELLED);
      }
      if (sale.status === "SOLD_OUT" || sale.remainingQuantity < 1) {
        throw new AppError(ERROR_DEFINITIONS.SALE_SOLD_OUT);
      }

      const ownership = await findOwnershipByOwnerAndCard(
        requesterId,
        input.offeredCardId,
        tx,
      );
      if (!ownership || ownership.quantity < 1) {
        throw new AppError(
          ERROR_DEFINITIONS.EXCHANGE_CARD_QUANTITY_INSUFFICIENT,
        );
      }

      // 같은 요청자는 한 판매글에 같은 카드로 대기 중인 제안을 하나만 등록한다.
      const pendingOffer = await findPendingOfferForSale(
        {
          requesterId,
          offeredCardId: input.offeredCardId,
          saleListingId: input.saleListingId,
        },
        tx,
      );
      if (pendingOffer) {
        throw new AppError(ERROR_DEFINITIONS.EXCHANGE_OFFER_ALREADY_EXISTS);
      }

      const pendingCount = await countPendingOffers(
        requesterId,
        input.offeredCardId,
        tx,
      );
      if (pendingCount >= ownership.quantity) {
        throw new AppError(ERROR_DEFINITIONS.EXCHANGE_CARD_QUANTITY_EXCEEDED);
      }

      // 등록은 제안/알림만 생성한다. 실제 카드 수량 이동은 승인 시 담당한다.
      return insertExchangeOfferWithNotification(
        { ...input, requesterId },
        sale.sellerId,
        tx,
      );
    },
    { isolationLevel: "Serializable" },
  );

  return {
    ...offer,
    id: offer.id.toString(),
    saleListingId: offer.saleListingId.toString(),
    requesterId: offer.requesterId.toString(),
    offeredCardId: offer.offeredCardId.toString(),
    createdAt: formatToKst(offer.createdAt),
  };
}
