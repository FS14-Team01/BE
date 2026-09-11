import prisma from "../config/prisma.js";

const SALE_CREATE_SELECT = {
  id: true,
  sellerId: true,
  photoCardId: true,
  initialQuantity: true,
  remainingQuantity: true,
  price: true,
  desiredGrade: true,
  desiredCategory: true,
  desiredDescription: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export function runSaleTransaction(callback) {
  return prisma.$transaction(callback, {
    isolationLevel: "Serializable",
  });
}

export function findSellerOwnership(database, sellerId, photoCardId) {
  return database.ownership.findUnique({
    where: {
      ownerId_photoCardId: {
        ownerId: sellerId,
        photoCardId,
      },
    },
  });
}

export function decreaseSellerOwnershipQuantity(
  database,
  sellerId,
  photoCardId,
  currentQuantity,
  quantity,
) {
  const where = {
    ownerId_photoCardId: {
      ownerId: sellerId,
      photoCardId,
    },
  };

  if (currentQuantity === quantity) {
    return database.ownership.delete({ where });
  }

  return database.ownership.update({
    where,
    data: {
      quantity: {
        decrement: quantity,
      },
    },
  });
}

export function createSaleListing(database, saleData) {
  return database.saleListing.create({
    data: saleData,
    select: SALE_CREATE_SELECT,
  });
}

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
