import prisma from '../config/prisma.js';

// 사용자 포인트 조회
async function findMyPoint(userId) {
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
async function findRandomPointDraw(userId, date, period) {
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
async function createRandomPointDraw(tx, data) {
  return await tx.randomPointDraw.create({
    data,
  });
}

// User point 증가
async function incrementUserPoint(tx, userId, amount) {
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
    }
  });
}

// PointTransaction 생성
async function createPointTransaction(tx, data) {
  await tx.pointTransaction.create({
    data,
  });
}

export default {
  findMyPoint,
  findRandomPointDraw,
  createRandomPointDraw,
  incrementUserPoint,
  createPointTransaction,
}