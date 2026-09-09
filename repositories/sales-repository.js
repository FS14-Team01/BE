import prisma from "../config/prisma.js";

export function findSaleDetailById(saleId) {
  return prisma.saleListing.findUnique({
    where: {
      id: saleId,
    },
    select: {
      id: true,
      initialQuantity: true,
      remainingQuantity: true,
      price: true,
      desiredGrade: true,
      desiredCategory: true,
      desiredDescription: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      seller: {
        select: {
          id: true,
          nickname: true,
        },
      },
      photoCard: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          grade: true,
          category: true,
          description: true,
        },
      },
    },
  });
}
