import prisma from "../config/prisma.js";

export function findMarketSummaryRows(keyword) {
  return prisma.saleListing.findMany({
    where: {
      status: { in: ["ON_SALE", "SOLD_OUT"] },
      ...(keyword && {
        photoCard: { name: { contains: keyword, mode: "insensitive" } },
      }),
    },
    select: {
      status: true,
      photoCard: { select: { grade: true, category: true } },
    },
  });
}
