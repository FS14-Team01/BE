import { findSaleDetailById } from '../repositories/sales.repository.js';
import HttpError from '../utils/http-error.js';

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

export async function getSaleDetailById(saleId) {
  if (!POSITIVE_INTEGER_PATTERN.test(saleId)) {
    throw new HttpError(400, '유효하지 않은 판매글 ID입니다.');
  }

  const sale = await findSaleDetailById(BigInt(saleId));

  if (!sale) {
    throw new HttpError(
      404,
      '판매 정보를 찾을 수 없습니다.',
      'SALE_NOT_FOUND',
    );
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
