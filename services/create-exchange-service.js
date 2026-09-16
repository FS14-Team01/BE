import prisma from "../config/prisma.js";
import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";
import { validateCreateExchangeOffer } from "../validator/create-exchange-validator.js";
import {
  findOwnershipByOwnerAndCard,
  findSaleListingById,
} from "../repositories/exchange-repository.js";
import {
  countPendingOffers,
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
        throw new AppError({
          ...ERROR_DEFINITIONS.SALE_CANCELLED,
          message: "취소된 판매에는 교환을 제안할 수 없습니다.",
        });
      }
      if (sale.status === "SOLD_OUT" || sale.remainingQuantity < 1) {
        throw new AppError({
          ...ERROR_DEFINITIONS.SALE_SOLD_OUT,
          message: "품절된 판매에는 교환을 제안할 수 없습니다.",
        });
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
  };
}
