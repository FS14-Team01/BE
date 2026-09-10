import prisma from "../config/prisma.js";

// 사용자 포인트 조회
async function findPointByUserId(userId) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      points: true,
    },
  });

  return user.points;
}

// RandomPointDraw 조회
async function findRandomPointDrawByPeriod(userId, date, period) {
  return await prisma.randomPointDraw.findUnique({
    where: {
      userId_drawDate_period: {
        userId,
        drawDate: date,
        period,
      },
    },
  });
}

// RandomPointDraw 생성
async function createRandomPointDrawRecord(tx, data) {
  return await tx.randomPointDraw.create({
    data,
  });
}

// User point 증가
async function incrementUserPoints(tx, userId, amount) {
  return await tx.user.update({
    where: {
      id: userId,
    },
    data: {
      points: {
        increment: amount,
      },
    },
    select: {
      points: true,
    },
  });
}

// PointTransaction 생성
async function createPointTransaction(tx, data) {
  await tx.pointTransaction.create({
    data,
  });
}

export {
  createPointTransaction,
  createRandomPointDrawRecord,
  findPointByUserId,
  findRandomPointDrawByPeriod,
  incrementUserPoints,
};
