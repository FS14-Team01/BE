import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";
import {
  findOwnershipsByOwnerId,
  findOwnershipSummaryByOwnerId,
} from "../repositories/ownership-repository.js";
import { findUserById } from "../repositories/user-repository.js";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 12;
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const MAX_DATABASE_BIGINT = 9_223_372_036_854_775_807n;
const OWNERSHIP_QUERY_FIELDS = new Set([
  "keyword",
  "grade",
  "category",
  "cursor",
  "limit",
]);
const CARD_GRADES = new Set(["COMMON", "RARE", "SUPER_RARE", "LEGENDARY"]);
const CARD_CATEGORIES = new Set([
  "POKEMON",
  "SUPER_MARIO",
  "HELLO_KITTY",
  "DIGIMON",
]);

function parseUserId(userId) {
  if (
    typeof userId !== "string" ||
    !POSITIVE_INTEGER_PATTERN.test(userId)
  ) {
    throw new AppError(ERROR_DEFINITIONS.UNAUTHORIZED);
  }

  const parsedUserId = BigInt(userId);

  if (parsedUserId > MAX_DATABASE_BIGINT) {
    throw new AppError(ERROR_DEFINITIONS.UNAUTHORIZED);
  }

  return parsedUserId;
}

function parseCursor(cursor) {
  if (cursor === undefined) {
    return undefined;
  }

  if (
    typeof cursor !== "string" ||
    !POSITIVE_INTEGER_PATTERN.test(cursor)
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const parsedCursor = BigInt(cursor);

  if (parsedCursor > MAX_DATABASE_BIGINT) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  return parsedCursor;
}

function parseLimit(limit) {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  if (typeof limit !== "string" || !POSITIVE_INTEGER_PATTERN.test(limit)) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const parsedLimit = Number(limit);

  if (parsedLimit > MAX_LIMIT) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  return parsedLimit;
}

function validateOwnershipQuery(query) {
  if (
    !query ||
    typeof query !== "object" ||
    Array.isArray(query) ||
    Object.keys(query).some((field) => !OWNERSHIP_QUERY_FIELDS.has(field))
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  if (query.keyword !== undefined && typeof query.keyword !== "string") {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  if (query.grade !== undefined && !CARD_GRADES.has(query.grade)) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  if (query.category !== undefined && !CARD_CATEGORIES.has(query.category)) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  return {
    keyword: query.keyword?.trim() || undefined,
    grade: query.grade,
    category: query.category,
    cursor: parseCursor(query.cursor),
    limit: parseLimit(query.limit),
  };
}

async function getMyOwnerships(userId, query) {
  const parsedUserId = parseUserId(userId);
  const filters = validateOwnershipQuery(query);
  const user = await findUserById(parsedUserId);

  if (!user) {
    throw new AppError(ERROR_DEFINITIONS.UNAUTHORIZED);
  }

  const [ownerships, summaryRows] = await Promise.all([
    findOwnershipsByOwnerId({
      ownerId: parsedUserId,
      ...filters,
    }),
    findOwnershipSummaryByOwnerId(parsedUserId),
  ]);
  const hasNext = ownerships.length > filters.limit;
  const pageItems = hasNext
    ? ownerships.slice(0, filters.limit)
    : ownerships;

  const summary = summaryRows.reduce(
    (result, ownership) => {
      result.totalQuantity += ownership.quantity;
      result.gradeQuantities[ownership.photoCard.grade] += ownership.quantity;

      return result;
    },
    {
      totalQuantity: 0,
      gradeQuantities: {
        COMMON: 0,
        RARE: 0,
        SUPER_RARE: 0,
        LEGENDARY: 0,
      },
    },
  );

  return {
    summary,
    items: pageItems.map((ownership) => ({
      id: ownership.id.toString(),
      quantity: ownership.quantity,
      createdAt: ownership.createdAt,
      updatedAt: ownership.updatedAt,
      photoCard: {
        id: ownership.photoCard.id.toString(),
        name: ownership.photoCard.name,
        imageUrl: ownership.photoCard.imageUrl,
        grade: ownership.photoCard.grade,
        category: ownership.photoCard.category,
      },
    })),
    nextCursor: hasNext ? pageItems.at(-1).id.toString() : null,
    hasNext,
  };
}

export { getMyOwnerships };
