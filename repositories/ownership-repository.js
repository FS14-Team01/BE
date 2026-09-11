import prisma from "../config/prisma.js";

async function findOwnershipsByOwnerId({
  ownerId,
  keyword,
  grade,
  category,
  cursor,
  limit,
}) {
  return prisma.ownership.findMany({
    where: {
      ownerId,
      quantity: { gt: 0 },
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
    select: {
      id: true,
      quantity: true,
      createdAt: true,
      updatedAt: true,
      photoCard: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          grade: true,
          category: true,
        },
      },
    },
  });
}

async function findOwnershipSummaryByOwnerId(ownerId) {
  return prisma.ownership.findMany({
    where: {
      ownerId,
      quantity: { gt: 0 },
    },
    select: {
      quantity: true,
      photoCard: {
        select: {
          grade: true,
        },
      },
    },
  });
}

export { findOwnershipsByOwnerId, findOwnershipSummaryByOwnerId };
