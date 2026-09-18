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

          // 포토카드 최초 생성자
          creator: {
            select: {
              nickname: true,
            },
          },
        },
      },
    },
  });
}

async function findOwnershipSummaryByOwnerId(ownerId) {
  return prisma.$queryRaw`
    SELECT
      pc.grade,
      pc.category,
      SUM(o.quantity)::int AS quantity
    FROM "Ownership" AS o
    INNER JOIN "PhotoCard" AS pc
      ON pc.id = o."photoCardId"
    WHERE
      o."ownerId" = ${ownerId}
      AND o.quantity > 0
    GROUP BY pc.grade, pc.category
  `;
}

export { findOwnershipsByOwnerId, findOwnershipSummaryByOwnerId };
