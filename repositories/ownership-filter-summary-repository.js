import prisma from "../config/prisma.js";

export function findOwnershipTypesByOwnerId(ownerId, keyword) {
  // ownerId + photoCardId is unique, so each row represents one card type.
  return prisma.ownership.findMany({
    where: {
      ownerId,
      quantity: { gt: 0 },
      ...(keyword && {
        photoCard: {
          name: { contains: keyword, mode: "insensitive" },
        },
      }),
    },
    select: {
      photoCard: { select: { grade: true, category: true } },
    },
  });
}
