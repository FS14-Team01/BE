import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";
import { formatToKst } from "../utils/kst-time.js";
import {
  cancelPendingExchangeOffers,
  createExchangeRejectedNotifications,
  findPendingExchangeOffers,
} from "../repositories/sales-stop-repository.js";
import {
  createSaleListing as createSaleListingRecord,
  decreaseSellerOwnershipQuantity,
  findSaleDetailById,
  findSales,
  findSaleForManagementById,
  findSaleSummaryBySellerId,
  findSalesBySellerId,
  findSellerOwnership,
  findSellerOwnershipByIds,
  returnSellerOwnershipQuantity,
  runSaleTransaction,
  updateSellerOwnershipQuantity,
  updateSaleListing,
} from "../repositories/sales-repository.js";

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const MAX_DATABASE_BIGINT = 9_223_372_036_854_775_807n;
const MAX_SALE_PRICE = 1000;
const DEFAULT_SALE_LIST_LIMIT = 12;
const MAX_SALE_LIST_LIMIT = 12;
const SALE_LIST_QUERY_FIELDS = new Set([
  "keyword",
  "grade",
  "category",
  "status",
  "cursor",
  "limit",
]);
const SALE_LIST_STATUSES = new Set(["ON_SALE", "SOLD_OUT"]);
const CREATE_FIELDS = new Set([
  "photoCardId",
  "quantity",
  "price",
  "desiredGrade",
  "desiredCategory",
  "desiredDescription",
]);
const UPDATE_FIELDS = new Set([
  "quantity",
  "price",
  "desiredGrade",
  "desiredCategory",
  "desiredDescription",
]);
const CARD_GRADES = new Set(["COMMON", "RARE", "SUPER_RARE", "LEGENDARY"]);
const CARD_CATEGORIES = new Set([
  "POKEMON",
  "SUPER_MARIO",
  "HELLO_KITTY",
  "DIGIMON",
]);
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 12;
const DEFAULT_SORT = "recent";
const MARKET_SALE_LIST_QUERY_FIELDS = new Set([
  "keyword",
  "grade",
  "category",
  "status",
  "sort",
  "cursor",
  "limit",
]);
const SALE_LIST_SORTS = new Set(["recent", "priceAsc", "priceDesc"]);

function parseDatabaseId(id, errorDefinition) {
  if (typeof id !== "string" || !POSITIVE_INTEGER_PATTERN.test(id)) {
    throw new AppError(errorDefinition);
  }

  const parsedId = BigInt(id);

  if (parsedId > MAX_DATABASE_BIGINT) {
    throw new AppError(errorDefinition);
  }

  return parsedId;
}

function validateCreateData(createData) {
  if (
    !createData ||
    typeof createData !== "object" ||
    Array.isArray(createData)
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const fields = Object.keys(createData);
  const hasRequiredFields = ["photoCardId", "quantity", "price"].every(
    (field) => field in createData,
  );

  if (
    !hasRequiredFields ||
    fields.some((field) => !CREATE_FIELDS.has(field))
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const photoCardId = parseDatabaseId(
    createData.photoCardId,
    ERROR_DEFINITIONS.INVALID_REQUEST,
  );

  if (!Number.isInteger(createData.quantity) || createData.quantity < 1) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_SALE_QUANTITY);
  }

  if (!Number.isInteger(createData.price) || createData.price < 0) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_SALE_PRICE);
  }

  if (createData.price > MAX_SALE_PRICE) {
    throw new AppError(ERROR_DEFINITIONS.SALE_PRICE_LIMIT_EXCEEDED);
  }

  if (
    "desiredGrade" in createData &&
    createData.desiredGrade !== null &&
    !CARD_GRADES.has(createData.desiredGrade)
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  if (
    "desiredCategory" in createData &&
    createData.desiredCategory !== null &&
    !CARD_CATEGORIES.has(createData.desiredCategory)
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  if (
    "desiredDescription" in createData &&
    createData.desiredDescription !== null &&
    typeof createData.desiredDescription !== "string"
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  return photoCardId;
}

function serializeCreatedSale(sale) {
  return {
    id: sale.id.toString(),
    sellerId: sale.sellerId.toString(),
    photoCardId: sale.photoCardId.toString(),
    initialQuantity: sale.initialQuantity,
    remainingQuantity: sale.remainingQuantity,
    price: sale.price,
    desiredGrade: sale.desiredGrade,
    desiredCategory: sale.desiredCategory,
    desiredDescription: sale.desiredDescription,
    status: sale.status,
    createdAt: formatToKst(sale.createdAt),
    updatedAt: formatToKst(sale.updatedAt),
  };
}

export async function createSaleListing(userId, createData) {
  const parsedUserId = parseDatabaseId(
    userId,
    ERROR_DEFINITIONS.UNAUTHORIZED,
  );
  const parsedPhotoCardId = validateCreateData(createData);

  const sale = await runSaleTransaction(async (database) => {
    const ownership = await findSellerOwnership(
      database,
      parsedUserId,
      parsedPhotoCardId,
    );

    if (!ownership || ownership.quantity < createData.quantity) {
      throw new AppError(ERROR_DEFINITIONS.SALE_QUANTITY_EXCEEDED);
    }

    await decreaseSellerOwnershipQuantity(
      database,
      parsedUserId,
      parsedPhotoCardId,
      ownership.quantity,
      createData.quantity,
    );

    return createSaleListingRecord(database, {
      sellerId: parsedUserId,
      photoCardId: parsedPhotoCardId,
      initialQuantity: createData.quantity,
      remainingQuantity: createData.quantity,
      price: createData.price,
      desiredGrade: createData.desiredGrade ?? null,
      desiredCategory: createData.desiredCategory ?? null,
      desiredDescription: createData.desiredDescription ?? null,
    });
  });

  return serializeCreatedSale(sale);
}

function parseSaleListLimit(limit) {
  if (limit === undefined) {
    return DEFAULT_SALE_LIST_LIMIT;
  }

  if (typeof limit !== "string" || !POSITIVE_INTEGER_PATTERN.test(limit)) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const parsedLimit = Number(limit);

  if (parsedLimit > MAX_SALE_LIST_LIMIT) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  return parsedLimit;
}

function validateSaleListQuery(query) {
  if (
    !query ||
    typeof query !== "object" ||
    Array.isArray(query) ||
    Object.keys(query).some((field) => !SALE_LIST_QUERY_FIELDS.has(field))
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

  if (query.status !== undefined && !SALE_LIST_STATUSES.has(query.status)) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  return {
    keyword: query.keyword?.trim() || undefined,
    grade: query.grade,
    category: query.category,
    status: query.status,
    cursor:
      query.cursor === undefined
        ? undefined
        : parseDatabaseId(query.cursor, ERROR_DEFINITIONS.INVALID_REQUEST),
    limit: parseSaleListLimit(query.limit),
  };
}

function serializeSaleListItem(sale) {
  return {
    id: sale.id.toString(),
    photoCardId: sale.photoCard.id.toString(),
    initialQuantity: sale.initialQuantity,
    remainingQuantity: sale.remainingQuantity,
    price: sale.price,
    status: sale.status,
    hasPendingExchange: sale.exchanges.length > 0,
    createdAt: formatToKst(sale.createdAt),
    updatedAt: formatToKst(sale.updatedAt),
    photoCard: {
      id: sale.photoCard.id.toString(),
      name: sale.photoCard.name,
      imageUrl: sale.photoCard.imageUrl,
      grade: sale.photoCard.grade,
      category: sale.photoCard.category,
      creatorNickname: sale.photoCard.creator.nickname,
    },
  };
}

export async function getSalesBySellerId(userId, query) {
  const sellerId = parseDatabaseId(userId, ERROR_DEFINITIONS.UNAUTHORIZED);
  const filters = validateSaleListQuery(query);
  const sales = await findSalesBySellerId({ sellerId, ...filters });
  const hasNext = sales.length > filters.limit;
  const pageItems = hasNext ? sales.slice(0, filters.limit) : sales;

  return {
    items: pageItems.map(serializeSaleListItem),
    nextCursor: hasNext ? pageItems.at(-1).id.toString() : null,
    hasNext,
  };
}

export async function getSaleSummaryBySellerId(userId) {
  const sellerId = parseDatabaseId(userId, ERROR_DEFINITIONS.UNAUTHORIZED);
  const summaryRows = await findSaleSummaryBySellerId(sellerId);

  return summaryRows.reduce(
    (summary, sale) => {
      summary.totalQuantity += sale.initialQuantity;
      summary.gradeQuantities[sale.photoCard.grade] += sale.initialQuantity;

      return summary;
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
}

function validateUpdateData(updateData) {
  if (
    !updateData ||
    typeof updateData !== "object" ||
    Array.isArray(updateData)
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const fields = Object.keys(updateData);

  if (
    fields.length === 0 ||
    fields.some((field) => !UPDATE_FIELDS.has(field))
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  if (
    "quantity" in updateData &&
    (!Number.isInteger(updateData.quantity) || updateData.quantity < 1)
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_SALE_QUANTITY);
  }

  if (
    "price" in updateData &&
    (!Number.isInteger(updateData.price) || updateData.price < 0)
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_SALE_PRICE);
  }

  if ("price" in updateData && updateData.price > MAX_SALE_PRICE) {
    throw new AppError(ERROR_DEFINITIONS.SALE_PRICE_LIMIT_EXCEEDED);
  }

  if (
    "desiredGrade" in updateData &&
    updateData.desiredGrade !== null &&
    !CARD_GRADES.has(updateData.desiredGrade)
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  if (
    "desiredCategory" in updateData &&
    updateData.desiredCategory !== null &&
    !CARD_CATEGORIES.has(updateData.desiredCategory)
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  if (
    "desiredDescription" in updateData &&
    updateData.desiredDescription !== null &&
    typeof updateData.desiredDescription !== "string"
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }
}

function validateManageableSale(sale, userId) {
  if (!sale) {
    throw new AppError(ERROR_DEFINITIONS.SALE_NOT_FOUND);
  }

  if (sale.sellerId !== userId) {
    throw new AppError(ERROR_DEFINITIONS.SALE_FORBIDDEN);
  }

  if (sale.status === "SOLD_OUT") {
    throw new AppError(ERROR_DEFINITIONS.SALE_SOLD_OUT);
  }

  if (sale.status === "CANCELLED") {
    throw new AppError(ERROR_DEFINITIONS.SALE_CANCELLED);
  }

  if (sale.status !== "ON_SALE") {
    throw new AppError(ERROR_DEFINITIONS.SALE_NOT_EDITABLE);
  }
}

function serializeManagedSale(sale) {
  return {
    id: sale.id.toString(),
    initialQuantity: sale.initialQuantity,
    remainingQuantity: sale.remainingQuantity,
    price: sale.price,
    desiredGrade: sale.desiredGrade,
    desiredCategory: sale.desiredCategory,
    desiredDescription: sale.desiredDescription,
    status: sale.status,
    createdAt: formatToKst(sale.createdAt),
    updatedAt: formatToKst(sale.updatedAt),
  };
}

export async function getSaleDetailById(saleId, userId) {
  const parsedSaleId = parseDatabaseId(
    saleId,
    ERROR_DEFINITIONS.INVALID_REQUEST,
  );
  const parsedUserId = parseDatabaseId(userId, ERROR_DEFINITIONS.UNAUTHORIZED);

  const sale = await findSaleDetailById(parsedSaleId);

  if (!sale || sale.status === "SOLD_OUT" || sale.status === "CANCELLED") {
    throw new AppError(ERROR_DEFINITIONS.SALE_NOT_FOUND);
  }

  const isOwner = sale.seller.id === parsedUserId;
  const ownership = isOwner
    ? await findSellerOwnershipByIds(sale.seller.id, sale.photoCard.id)
    : null;
  const ownedQuantity = ownership?.quantity ?? 0;
  const maxQuantity = sale.initialQuantity + ownedQuantity;

  return {
    id: sale.id.toString(),
    isOwner,
    maxQuantity: isOwner ? maxQuantity : null,
    initialQuantity: sale.initialQuantity,
    remainingQuantity: sale.remainingQuantity,
    price: sale.price,
    desiredGrade: sale.desiredGrade,
    desiredCategory: sale.desiredCategory,
    desiredDescription: sale.desiredDescription,
    status: sale.status,
    createdAt: formatToKst(sale.createdAt),
    updatedAt: formatToKst(sale.updatedAt),
    seller: {
      id: sale.seller.id.toString(),
      nickname: sale.seller.nickname,
    },
    photoCard: {
      id: sale.photoCard.id.toString(),
      name: sale.photoCard.name,
      imageUrl: sale.photoCard.imageUrl,
      grade: sale.photoCard.grade,
      category: sale.photoCard.category,
      description: sale.photoCard.description,
    },
  };
}

export async function updateSaleById(saleId, userId, updateData) {
  const parsedSaleId = parseDatabaseId(
    saleId,
    ERROR_DEFINITIONS.INVALID_REQUEST,
  );
  const parsedUserId = parseDatabaseId(userId, ERROR_DEFINITIONS.UNAUTHORIZED);

  validateUpdateData(updateData);

  const updatedSale = await runSaleTransaction(async (database) => {
    const sale = await findSaleForManagementById(database, parsedSaleId);

    validateManageableSale(sale, parsedUserId);

    const data = {};

    if ("quantity" in updateData) {
      const quantityChange = updateData.quantity - sale.initialQuantity;
      const nextRemainingQuantity = sale.remainingQuantity + quantityChange;

      if (nextRemainingQuantity < 1) {
        throw new AppError(ERROR_DEFINITIONS.INVALID_SALE_QUANTITY);
      }

      const ownership = await findSellerOwnership(
        database,
        sale.sellerId,
        sale.photoCardId,
      );

      if (quantityChange > (ownership?.quantity ?? 0)) {
        throw new AppError(ERROR_DEFINITIONS.SALE_QUANTITY_EXCEEDED);
      }

      if (quantityChange > 0) {
        await updateSellerOwnershipQuantity(
          database,
          sale.sellerId,
          sale.photoCardId,
          -quantityChange,
        );
      }

      if (quantityChange < 0) {
        await returnSellerOwnershipQuantity(
          database,
          sale.sellerId,
          sale.photoCardId,
          -quantityChange,
        );
      }

      data.initialQuantity = updateData.quantity;
      data.remainingQuantity = nextRemainingQuantity;
    }

    for (const field of [
      "price",
      "desiredGrade",
      "desiredCategory",
      "desiredDescription",
    ]) {
      if (field in updateData) {
        data[field] = updateData[field];
      }
    }

    return updateSaleListing(database, parsedSaleId, data);
  });

  return serializeManagedSale(updatedSale);
}

export async function stopSaleById(saleId, userId) {
  const parsedSaleId = parseDatabaseId(
    saleId,
    ERROR_DEFINITIONS.INVALID_REQUEST,
  );
  const parsedUserId = parseDatabaseId(userId, ERROR_DEFINITIONS.UNAUTHORIZED);

  const stoppedSale = await runSaleTransaction(async (database) => {
    const sale = await findSaleForManagementById(database, parsedSaleId);

    validateManageableSale(sale, parsedUserId);

    const pendingExchangeOffers = await findPendingExchangeOffers(
      database,
      parsedSaleId,
    );
    const resolvedAt = new Date();

    await returnSellerOwnershipQuantity(
      database,
      sale.sellerId,
      sale.photoCardId,
      sale.remainingQuantity,
    );

    const updatedSale = await updateSaleListing(database, parsedSaleId, {
      status: "CANCELLED",
    });

    await cancelPendingExchangeOffers(database, parsedSaleId, resolvedAt);
    await createExchangeRejectedNotifications(database, pendingExchangeOffers);

    return updatedSale;
  });

  return {
    id: stoppedSale.id.toString(),
    remainingQuantity: stoppedSale.remainingQuantity,
    status: stoppedSale.status,
    updatedAt: formatToKst(stoppedSale.updatedAt),
  };
}

function parseCursor(cursor) {
  if (cursor === undefined) {
    return undefined;
  }

  if (typeof cursor !== "string" || !POSITIVE_INTEGER_PATTERN.test(cursor)) {
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

function validateMarketSaleListQuery(query) {
  if (
    !query ||
    typeof query !== "object" ||
    Array.isArray(query) ||
    Object.keys(query).some((field) => !MARKET_SALE_LIST_QUERY_FIELDS.has(field))
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

  if (query.status !== undefined && !SALE_LIST_STATUSES.has(query.status)) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  if (query.sort !== undefined && !SALE_LIST_SORTS.has(query.sort)) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  return {
    keyword: query.keyword?.trim() || undefined,
    grade: query.grade,
    category: query.category,
    status: query.status,
    sort: query.sort ?? DEFAULT_SORT,
    cursor: parseCursor(query.cursor),
    limit: parseLimit(query.limit),
  };
}

export async function getSaleList(query) {
  const filters = validateMarketSaleListQuery(query);
  const sales = await findSales(filters);
  const hasNext = sales.length > filters.limit;
  const pageItems = hasNext ? sales.slice(0, filters.limit) : sales;

  return {
    items: pageItems.map((sale) => ({
      id: sale.id.toString(),
      initialQuantity: sale.initialQuantity,
      remainingQuantity: sale.remainingQuantity,
      price: sale.price,
      desiredGrade: sale.desiredGrade,
      desiredCategory: sale.desiredCategory,
      desiredDescription: sale.desiredDescription,
      status: sale.status,
      createdAt: formatToKst(sale.createdAt),
      updatedAt: formatToKst(sale.updatedAt),
      photoCard: {
        id: sale.photoCard.id.toString(),
        name: sale.photoCard.name,
        imageUrl: sale.photoCard.imageUrl,
        grade: sale.photoCard.grade,
        category: sale.photoCard.category,
        creatorNickname: sale.photoCard.creator.nickname,
      },
    })),
    nextCursor: hasNext ? pageItems.at(-1).id.toString() : null,
    hasNext,
  };
}
