import prisma from "../config/prisma.js";

const SALE_MANAGEMENT_SELECT = {
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

const SALE_LIST_SELECT = {
  id: true,
  initialQuantity: true,
  remainingQuantity: true,
  price: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  exchanges: {
    where: {
      status: "PENDING",
    },
    select: {
      id: true,
    },
    take: 1,
  },
  photoCard: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
      grade: true,
      category: true,
      creator: {
        select: {
          nickname: true,
        },
      },
    },
  },
};

export function findSalesBySellerId({
  sellerId,
  keyword,
  grade,
  category,
  status,
  cursor,
  limit,
}) {
  return prisma.saleListing.findMany({
    where: {
      sellerId,
      status: status ?? { in: ["ON_SALE", "SOLD_OUT"] },
      photoCard: {
        ...(keyword && {
          name: {
            contains: keyword,
            mode: "insensitive",
          },
        }),
        ...(grade && { grade }),
        ...(category && { category }),
      },
    },
    take: limit + 1,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: SALE_LIST_SELECT,
  });
}

export function findSaleSummaryBySellerId(sellerId, keyword) {
  return prisma.saleListing.findMany({
    where: {
      sellerId,
      status: { in: ["ON_SALE", "SOLD_OUT"] },
      ...(keyword && {
        photoCard: {
          name: {
            contains: keyword,
            mode: "insensitive",
          },
        },
      }),
    },
    select: {
      status: true,
      photoCard: {
        select: {
          grade: true,
          category: true,
        },
      },
    },
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

export function runSaleTransaction(callback) {
  return prisma.$transaction(callback, {
    isolationLevel: "Serializable",
  });
}

export function findSaleForManagementById(database, saleId) {
  return database.saleListing.findUnique({
    where: { id: saleId },
    select: SALE_MANAGEMENT_SELECT,
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
    select: { quantity: true },
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
    select: SALE_MANAGEMENT_SELECT,
  });
}

export function findSellerOwnershipByIds(sellerId, photoCardId) {
  return findSellerOwnership(prisma, sellerId, photoCardId);
}

export function updateSellerOwnershipQuantity(
  database,
  sellerId,
  photoCardId,
  quantityChange,
) {
  return database.ownership.update({
    where: {
      ownerId_photoCardId: {
        ownerId: sellerId,
        photoCardId,
      },
    },
    data: {
      quantity: {
        increment: quantityChange,
      },
    },
  });
}

export function returnSellerOwnershipQuantity(
  database,
  sellerId,
  photoCardId,
  quantity,
) {
  return database.ownership.upsert({
    where: {
      ownerId_photoCardId: {
        ownerId: sellerId,
        photoCardId,
      },
    },
    create: {
      ownerId: sellerId,
      photoCardId,
      quantity,
    },
    update: {
      quantity: {
        increment: quantity,
      },
    },
  });
}

export function updateSaleListing(database, saleId, updateData) {
  return database.saleListing.update({
    where: { id: saleId },
    data: updateData,
    select: SALE_MANAGEMENT_SELECT,
  });
}
