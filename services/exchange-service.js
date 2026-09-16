import prisma from "../config/prisma.js";
import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";
import { formatToKst } from "../utils/kst-time.js";
import {
  findSaleListingById,
  findExchangeOffersBySaleId,
  findExchangeOfferById,
  rejectExchangeOfferById,
  createExchangeRejectedNotification,
  findOwnershipByOwnerAndCard,
  decreaseOwnershipQuantity,
  increaseOwnershipQuantity,
  decreaseSaleListingQuantity,
  acceptExchangeOfferById,
  createExchangeAcceptedNotification,
  findOtherPendingExchangeOffersBySaleId,
  rejectOtherPendingExchangeOffersBySaleId,
} from "../repositories/exchange-repository.js";

// sales-service.js 기준에 맞춤
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const MAX_DATABASE_BIGINT = 9_223_372_036_854_775_807n;

// 공통 페이지네이션 정책
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 12;

async function getExchangeOffersBySale({ saleId, userId, cursor, limit }) {
  if (!POSITIVE_INTEGER_PATTERN.test(saleId)) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const parsedSaleId = BigInt(saleId);

  if (parsedSaleId > MAX_DATABASE_BIGINT) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const parsedLimit = limit === undefined ? DEFAULT_LIMIT : Number(limit);

  if (
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    parsedLimit > MAX_LIMIT
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  let parsedCursor;

  if (cursor !== undefined) {
    if (!POSITIVE_INTEGER_PATTERN.test(cursor)) {
      throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
    }

    parsedCursor = BigInt(cursor);

    if (parsedCursor > MAX_DATABASE_BIGINT) {
      throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
    }
  }

  const saleListing = await findSaleListingById(parsedSaleId);

  if (!saleListing) {
    throw new AppError(ERROR_DEFINITIONS.SALE_NOT_FOUND);
  }

  if (saleListing.sellerId !== BigInt(userId)) {
    throw new AppError(ERROR_DEFINITIONS.EXCHANGE_OFFER_NOT_FOUND);
  }

  const exchangeOffers = await findExchangeOffersBySaleId(parsedSaleId, {
    cursor: parsedCursor,
    take: parsedLimit + 1,
  });

  const hasNextPage = exchangeOffers.length > parsedLimit;
  const currentPage = hasNextPage
    ? exchangeOffers.slice(0, parsedLimit)
    : exchangeOffers;

  const items = currentPage.map((exchangeOffer) => ({
    ...exchangeOffer,
    id: exchangeOffer.id.toString(),
  }));

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNext: hasNextPage,
  };
}

async function rejectExchangeOffer({ exchangeOfferId, userId }) {
  if (!POSITIVE_INTEGER_PATTERN.test(exchangeOfferId)) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const parsedExchangeOfferId = BigInt(exchangeOfferId);

  if (parsedExchangeOfferId > MAX_DATABASE_BIGINT) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }
  // userId 유효성 검증은 인증 미들웨어에서 공통 처리
  const parsedUserId = BigInt(userId);

  const rejectedExchangeOffer = await prisma.$transaction(
    async (tx) => {
      const exchangeOffer = await findExchangeOfferById(
        parsedExchangeOfferId,
        tx,
      );

      if (!exchangeOffer) {
        throw new AppError(ERROR_DEFINITIONS.EXCHANGE_OFFER_NOT_FOUND);
      }

      const saleListing = await findSaleListingById(
        exchangeOffer.saleListingId,
        tx,
      );

      // DB 무결성이 깨진 비정상 상황 방어
      if (!saleListing) {
        throw new AppError(ERROR_DEFINITIONS.EXCHANGE_OFFER_NOT_FOUND);
      }

      if (parsedUserId !== saleListing.sellerId) {
        throw new AppError(ERROR_DEFINITIONS.EXCHANGE_OFFER_NOT_FOUND);
      }

      if (exchangeOffer.status !== "PENDING") {
        throw new AppError(ERROR_DEFINITIONS.EXCHANGE_OFFER_ALREADY_PROCESSED);
      }

      const rejectedExchangeOffer = await rejectExchangeOfferById(
        exchangeOffer.id,
        tx,
      );

      await createExchangeRejectedNotification(
        exchangeOffer.requesterId,
        exchangeOffer.id,
        tx,
      );

      return rejectedExchangeOffer;
    },
    {
      isolationLevel: "Serializable",
    },
  );

  return {
    ...rejectedExchangeOffer,
    id: rejectedExchangeOffer.id.toString(),
    resolvedAt: formatToKst(rejectedExchangeOffer.resolvedAt),
  };
}

async function acceptExchangeOffer({ exchangeOfferId, userId }) {
  // exchangeOfferId 형식 검증
  if (!POSITIVE_INTEGER_PATTERN.test(exchangeOfferId)) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const parsedExchangeOfferId = BigInt(exchangeOfferId);

  if (parsedExchangeOfferId > MAX_DATABASE_BIGINT) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  // userId 유효성 검증은 인증 미들웨어에서 공통 처리
  const parsedUserId = BigInt(userId);

  const acceptedExchangeOffer = await prisma.$transaction(
    async (tx) => {
      // 교환 제안 조회
      const exchangeOffer = await findExchangeOfferById(
        parsedExchangeOfferId,
        tx,
      );

      if (!exchangeOffer) {
        throw new AppError(ERROR_DEFINITIONS.EXCHANGE_OFFER_NOT_FOUND);
      }

      // 판매 중인 카드 조회
      const saleListing = await findSaleListingById(
        exchangeOffer.saleListingId,
        tx,
      );

      if (!saleListing) {
        throw new AppError(ERROR_DEFINITIONS.EXCHANGE_OFFER_NOT_FOUND);
      }

      // 판매자 권한 검증
      if (parsedUserId !== saleListing.sellerId) {
        throw new AppError(ERROR_DEFINITIONS.EXCHANGE_OFFER_NOT_FOUND);
      }

      // 교환 제안 상태 검증
      if (exchangeOffer.status !== "PENDING") {
        throw new AppError(ERROR_DEFINITIONS.EXCHANGE_OFFER_ALREADY_PROCESSED);
      }

      if (saleListing.status === "SOLD_OUT") {
        throw new AppError(ERROR_DEFINITIONS.SALE_SOLD_OUT);
      }

      if (saleListing.status === "CANCELLED") {
        throw new AppError(ERROR_DEFINITIONS.SALE_CANCELLED);
      }

      // 판매 수량 검증
      if (saleListing.remainingQuantity < 1) {
        throw new AppError(ERROR_DEFINITIONS.INSUFFICIENT_SALE_QUANTITY);
      }

      // 교환 승인 시점 기준으로 제안 카드 보유 수량 검증
      const requesterOwnership = await findOwnershipByOwnerAndCard(
        exchangeOffer.requesterId,
        exchangeOffer.offeredCardId,
        tx,
      );

      if (!requesterOwnership || requesterOwnership.quantity < 1) {
        throw new AppError(
          ERROR_DEFINITIONS.EXCHANGE_CARD_QUANTITY_INSUFFICIENT,
        );
      }

      // 실제 수량 이동
      await decreaseOwnershipQuantity(requesterOwnership, tx);

      await increaseOwnershipQuantity(
        saleListing.sellerId,
        exchangeOffer.offeredCardId,
        tx,
      );

      await decreaseSaleListingQuantity(saleListing, tx);

      await increaseOwnershipQuantity(
        exchangeOffer.requesterId,
        saleListing.photoCardId,
        tx,
      );

      // 교환 제안을 승인 상태로 변경
      const acceptedExchangeOffer = await acceptExchangeOfferById(
        exchangeOffer.id,
        tx,
      );

      // 교환 요청자에게 승인 알림 생성
      await createExchangeAcceptedNotification(
        exchangeOffer.requesterId,
        exchangeOffer.id,
        tx,
      );

      // 교환 승인으로 판매 카드가 SOLD_OUT이 되면 나머지 PENDING 교환 제안을 거절 상태로 변경
      // 교환 승인으로 품절되는 경우는 판매자 본인의 승인 행위로 발생한 결과이므로
      // 판매자에게 CARD_SOLD_OUT 알림은 별도로 생성하지 않고 승인 성공 Toast로 결과를 안내
      if (saleListing.remainingQuantity === 1) {
        const rejectedExchangeOffers =
          await findOtherPendingExchangeOffersBySaleId(
            saleListing.id,
            exchangeOffer.id,
            tx,
          );

        await rejectOtherPendingExchangeOffersBySaleId(
          saleListing.id,
          exchangeOffer.id,
          tx,
        );

        for (const rejectedExchangeOffer of rejectedExchangeOffers) {
          await createExchangeRejectedNotification(
            rejectedExchangeOffer.requesterId,
            rejectedExchangeOffer.id,
            tx,
          );
        }
      }

      return acceptedExchangeOffer;
    },
    {
      isolationLevel: "Serializable",
    },
  );

  return {
    ...acceptedExchangeOffer,
    id: acceptedExchangeOffer.id.toString(),
    resolvedAt: formatToKst(acceptedExchangeOffer.resolvedAt),
  };
}

export { getExchangeOffersBySale, rejectExchangeOffer, acceptExchangeOffer };
