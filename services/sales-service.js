import AppError from '../errors/app-error.js';
import { ERROR_DEFINITIONS } from '../errors/error-definitions.js';
import { findSaleDetailById } from '../repositories/sales-repository.js';

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const MAX_DATABASE_BIGINT = 9_223_372_036_854_775_807n;

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
