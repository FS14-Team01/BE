import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";
import {
  findByUserId,
  updateAllAsRead,
} from "../repositories/notification-repository.js";
import { formatToKst } from "../utils/kst-time.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 20;
const CURSOR_PATTERN = /^[1-9]\d*$/;
const MAX_BIGINT = 9223372036854775807n;

// isRead 쿼리 검증
function parseOptionalBoolean(isReadStr) {
  if (isReadStr === undefined) return undefined;
  if (isReadStr === "true") return true;
  if (isReadStr === "false") return false;

  throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
}

// limit 쿼리 검증
function parseLimit(limitStr) {
  if (limitStr === undefined) return DEFAULT_LIMIT;

  const parsedLimit = Number(limitStr);
  if (
    Number.isInteger(parsedLimit) &&
    parsedLimit >= 1 &&
    parsedLimit <= MAX_LIMIT
  ) {
    return parsedLimit;
  }

  throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
}

// cursor 쿼리 검증
function parseCursor(cursorStr) {
  if (cursorStr === undefined) return undefined;

  const isPositiveInteger = CURSOR_PATTERN.test(cursorStr);
  if (isPositiveInteger) {
    const parsedCursor = BigInt(cursorStr);
    if (parsedCursor <= MAX_BIGINT) {
      return parsedCursor;
    }
  }

  throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
}

// BigInt ID를 응답용 문자열로 변환
function stringifyNullableId(id) {
  return id === null ? null : String(id);
}

// 응답 가공
function formatNotification(notification) {
  const baseNotification = {
    id: String(notification.id),
    type: notification.type,
    relatedSaleListingId: stringifyNullableId(
      notification.relatedSaleListingId,
    ),
    relatedExchangeId: stringifyNullableId(notification.relatedExchangeId),
    relatedPurchaseId: stringifyNullableId(notification.relatedPurchaseId),
    isRead: notification.isRead,
    createdAt: formatToKst(notification.createdAt),
  };

  switch (notification.type) {
    case "CARD_SOLD":
      if (!notification.relatedPurchase) {
        throw new AppError(ERROR_DEFINITIONS.INTERNAL_SERVER_ERROR);
      }

      return {
        ...baseNotification,
        userNickname: notification.relatedPurchase.buyer.nickname,
        cardGrade: notification.relatedPurchase.saleListing.photoCard.grade,
        cardName: notification.relatedPurchase.saleListing.photoCard.name,
        quantity: notification.relatedPurchase.quantity,
      };
    case "CARD_SOLD_OUT":
      if (!notification.relatedSaleListing) {
        throw new AppError(ERROR_DEFINITIONS.INTERNAL_SERVER_ERROR);
      }

      return {
        ...baseNotification,
        userNickname: null,
        cardGrade: notification.relatedSaleListing.photoCard.grade,
        cardName: notification.relatedSaleListing.photoCard.name,
        quantity: 0,
      };
    case "EXCHANGE_OFFER_RECEIVED":
      if (!notification.relatedExchange) {
        throw new AppError(ERROR_DEFINITIONS.INTERNAL_SERVER_ERROR);
      }

      return {
        ...baseNotification,
        userNickname: notification.relatedExchange.requester.nickname,
        cardGrade: notification.relatedExchange.offeredCard.grade,
        cardName: notification.relatedExchange.offeredCard.name,
        quantity: 1,
      };
    case "EXCHANGE_ACCEPTED":
    case "EXCHANGE_REJECTED":
      if (!notification.relatedExchange) {
        throw new AppError(ERROR_DEFINITIONS.INTERNAL_SERVER_ERROR);
      }

      return {
        ...baseNotification,
        userNickname: notification.relatedExchange.saleListing.seller.nickname,
        cardGrade: notification.relatedExchange.offeredCard.grade,
        cardName: notification.relatedExchange.offeredCard.name,
        quantity: 1,
      };
    default:
      throw new AppError(ERROR_DEFINITIONS.INTERNAL_SERVER_ERROR);
  }
}

async function getUserNotifications(userId, query) {
  // 1. query 검증
  const isRead = parseOptionalBoolean(query.isRead);
  const limit = parseLimit(query.limit);
  const cursor = parseCursor(query.cursor);

  // 2. 사용자 알림 조회
  const notifications = await findByUserId(userId, isRead, limit, cursor);

  // 3. hasNext, nextCursor 계산
  let nextCursor = null;
  let hasNext = false;

  if (notifications.length > limit) {
    notifications.pop();
    nextCursor = String(notifications.at(-1).id);
    hasNext = true;
  }

  // 4. 타입별 응답 데이터 가공
  const items = notifications.map((notification) =>
    formatNotification(notification),
  );

  return {
    items,
    nextCursor,
    hasNext,
  };
}

async function markNotificationsAsRead(userId) {
  // 1. 사용자의 읽지 않은 알림을 모두 읽음 상태로 변경
  await updateAllAsRead(userId);

  return {
    message: "모든 알림을 읽음 처리했습니다.",
  };
}

export { getUserNotifications, markNotificationsAsRead };
