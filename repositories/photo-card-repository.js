import prisma from "../config/prisma.js";

export function countCreatedPhotoCards(userId, startOfWeek) {
  return prisma.photoCard.count({
    where: {
      creatorId: userId,
      createdAt: {
        gte: startOfWeek,
      },
    },
  });
}

export async function createPhotoCardWithOwnership({
  userId,
  name,
  imageUrl,
  grade,
  category,
  description,
  totalSupply,
}) {
  const result = await prisma.$transaction(async (tx) => {
    const photoCard = await tx.photoCard.create({
      data: {
        creatorId: userId,
        name,
        imageUrl,
        grade,
        category,
        description,
        totalSupply,
      },
    });

    const ownership = await tx.ownership.create({
      data: {
        ownerId: userId,
        photoCardId: photoCard.id,
        quantity: totalSupply,
      },
    });

    return {
      photoCard,
      ownership,
    };
  });

  return result;
}