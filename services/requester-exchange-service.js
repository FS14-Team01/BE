import prisma from "../config/prisma.js";
import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";
import { formatToKst } from "../utils/kst-time.js";
import { findUserById } from "../repositories/user-repository.js";
import {
  parseExchangeId,
  validateCancelExchange,
  validateMyExchangeQuery,
} from "../validator/requester-exchange-validator.js";

export async function getMyExchangeOffers(userId, query) {
  const { limit, cursor, saleId } = validateMyExchangeQuery(query);
  const requesterId = BigInt(userId);
  if (!(await findUserById(requesterId))) {
    throw new AppError(ERROR_DEFINITIONS.UNAUTHORIZED);
  }
  // 선택 Query인 saleId를 지정하면 해당 판매글로 제한하고, 생략하면 본인의 전체 제안을 조회한다.
  const where = {
    requesterId,
    ...(saleId !== undefined ? { saleListingId: saleId } : {}),
  };
  if (cursor !== undefined) {
    const ownCursor = await prisma.exchange.findFirst({
      where: { ...where, id: cursor },
      select: { id: true },
    });
    if (!ownCursor) throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }
  const rows = await prisma.exchange.findMany({
    where,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit + 1,
    ...(cursor !== undefined ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      status: true,
      offeredDescription: true,
      requester: { select: { nickname: true } },
      offeredCard: {
        select: { name: true, imageUrl: true, grade: true, category: true },
      },
      saleListing: { select: { price: true } },
    },
  });
  const hasNext = rows.length > limit;
  const items = rows
    .slice(0, limit)
    .map((row) => ({ ...row, id: row.id.toString() }));
  return { items, nextCursor: hasNext ? items.at(-1).id : null, hasNext };
}

export async function cancelMyExchangeOffer({ exchangeOfferId, userId, body }) {
  validateCancelExchange(body);
  const id = parseExchangeId(exchangeOfferId);
  // 인증 미들웨어가 검증한 현재 사용자만 취소할 수 있다.
  const requesterId = BigInt(userId);
  return await prisma.$transaction(
    async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: requesterId },
        select: { id: true },
      });
      if (!user) throw new AppError(ERROR_DEFINITIONS.UNAUTHORIZED);

      const resolvedAt = new Date();
      // Serializable에서도 본인 여부와 PENDING 조건을 유지한다.
      const { count } = await tx.exchange.updateMany({
        where: { id, requesterId, status: "PENDING" },
        data: { status: "CANCELLED", resolvedAt },
      });
      if (count === 0) {
        const ownOffer = await tx.exchange.findFirst({
          where: { id, requesterId },
          select: { id: true },
        });
        throw new AppError(
          ownOffer
            ? ERROR_DEFINITIONS.EXCHANGE_OFFER_ALREADY_PROCESSED
            : ERROR_DEFINITIONS.EXCHANGE_OFFER_NOT_FOUND,
        );
      }

      // 등록 시 재고를 차감하지 않으므로 취소 시 수량/포인트도 변경하지 않는다.
      return {
        id: id.toString(),
        status: "CANCELLED",
        resolvedAt: formatToKst(resolvedAt),
      };
    },
    { isolationLevel: "Serializable" },
  );
}
