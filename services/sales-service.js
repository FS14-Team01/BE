import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";
import {
  createSaleListing as createSaleListingRecord,
  decreaseSellerOwnershipQuantity,
  findSaleDetailById,
  findSellerOwnership,
  runSaleTransaction,
} from "../repositories/sales-repository.js";

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const MAX_DATABASE_BIGINT = 9_223_372_036_854_775_807n;
const MAX_SALE_PRICE = 1000;
const CREATE_FIELDS = new Set([
  "photoCardId",
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
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
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

export async function getSaleDetailById(saleId) {
  if (!POSITIVE_INTEGER_PATTERN.test(saleId)) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const parsedSaleId = BigInt(saleId);

  if (parsedSaleId > MAX_DATABASE_BIGINT) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const sale = await findSaleDetailById(parsedSaleId);

  if (!sale) {
    throw new AppError(ERROR_DEFINITIONS.SALE_NOT_FOUND);
  }

  return {
    id: sale.id.toString(),
    initialQuantity: sale.initialQuantity,
    remainingQuantity: sale.remainingQuantity,
    price: sale.price,
    desiredGrade: sale.desiredGrade,
    desiredCategory: sale.desiredCategory,
    desiredDescription: sale.desiredDescription,
    status: sale.status,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
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
