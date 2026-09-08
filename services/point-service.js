import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";
import pointRepository from "../repositories/point-repository.js";

// 응답 내 createdAt KST 형식으로 변환
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function formatToKst(date) {
  const kstDate = new Date(date.getTime() + KST_OFFSET_MS);
  const dateString = kstDate.toISOString().slice(0, 19);

  return `${dateString}+09:00`;
}

// 응답 형식 포맷 함수
function formatRandomPointDrawResponse(
  randomPointDraw,
  unselectedAmounts,
  points,
) {
  return {
    randomPointDraw: {
      id: String(randomPointDraw.id),
      userId: String(randomPointDraw.userId),
      drawDate: randomPointDraw.drawDate.toISOString().slice(0, 10),
      period: randomPointDraw.period,
      amount: randomPointDraw.amount,
      unselectedAmounts,
      createdAt: formatToKst(randomPointDraw.createdAt),
    },
    points,
  };
}

// 서버 시간을 KST로 계산
function getKstDate() {
  const utcDate = new Date();
  const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
  const dateString = kstDate.toISOString().slice(0, 10);

  return {
    drawDate: new Date(`${dateString}T00:00:00.000Z`),
    hour: kstDate.getUTCHours(),
  };
}

// 현재 시간에 따른 시간대 계산
function getPeriod(hour) {
  if (hour >= 0 && hour < 12) {
    return "MORNING";
  } else {
    return "AFTERNOON";
  }
}

// 랜덤 포인트 확률표 [포인트, 가중치]
const RANDOM_POINT_WEIGHTS = [
  [5, 30],
  [10, 25],
  [20, 20],
  [50, 15],
  [100, 8],
  [200, 2],
];

// 가중치 기반 랜덤 포인트 추첨
function drawRandomPoint(list) {
  // 1. 전체 가중치 계산
  let total = 0;
  for (let i = 0; i < list.length; i++) {
    total += list[i][1];
  }

  // 2. 전체 합계 범위의 랜덤 숫자 하나 생성
  const threshold = Math.random() * total;

  // 3. 목록 순회하면서 누적 가중치에 해당하는 포인트 반환
  total = 0;
  for (let i = 0; i < list.length; i++) {
    total += list[i][1];

    if (total >= threshold) {
      return list[i][0];
    }
  }
}

async function getMyPoint(userId) {
  // 1. 사용자의 포인트 조회
  const userPoint = await pointRepository.findMyPoint(userId);

  // 2.  현재 KST 날짜와 시간대 계산
  const { drawDate, hour } = getKstDate();
  const period = getPeriod(hour);

  // 3. RandomPointDraw 기록 조회
  const existingDraw = await pointRepository.findRandomPointDraw(
    userId,
    drawDate,
    period,
  );

  // 4. 기록 존재 여부로 canUseRandomBox 계산
  const canUseRandomBox = !existingDraw;

  // 5. 응답 반환
  return {
    points: userPoint,
    canUseRandomBox,
  };
}

async function createRandomPointDraw(userId) {
  // 1. 현재 KST 날짜와 시간대 계산
  const { drawDate, hour } = getKstDate();
  const period = getPeriod(hour);

  // 2. RandomPointDraw 기록 조회
  const existingDraw = await pointRepository.findRandomPointDraw(
    userId,
    drawDate,
    period,
  );

  // 3. 이미 기록이 있으면 409에러 반환
  if (existingDraw) {
    const error = new Error(
      "현재 시간대의 랜덤 포인트 기회를 이미 사용했습니다.",
    );
    error.status = 409;
    error.code = "RANDOM_BOX_ALREADY_USED";
    throw error;
  }

  // 4. 랜덤 포인트(amount) 생성
  const amount = drawRandomPoint(RANDOM_POINT_WEIGHTS);

  // 5. 연출용 랜덤 포인트(UnselectedAmounts) 생성
  const unselectedPointList = RANDOM_POINT_WEIGHTS.filter(
    (innerArray) => innerArray[0] !== amount,
  );

  const unselectedAmount1 = drawRandomPoint(unselectedPointList); // 실제 지급 포인트를 제외하고 기존 확률표로 추첨
  const unselectedAmount2 = Math.random() < 0.5 ? 100 : 200; // 100P 또는 200P

  const unselectedAmounts =
    Math.random() < 0.5
      ? [unselectedAmount1, unselectedAmount2]
      : [unselectedAmount2, unselectedAmount1];

  try {
    // 6. 트랙잭션
    const result = await prisma.$transaction(async (tx) => {
      const newRandomPointDraw = await pointRepository.createRandomPointDraw(
        tx,
        {
          userId,
          drawDate,
          period,
          amount,
        },
      );

      const updatedUser = await pointRepository.incrementUserPoint(
        tx,
        userId,
        amount,
      );

      await pointRepository.createPointTransaction(tx, {
        userId,
        amount,
        type: "RANDOM_BOX",
      });

      return {
        randomPointDraw: newRandomPointDraw,
        points: updatedUser.points,
      };
    });

    // 7. 성공 시 응답 반환
    return formatRandomPointDrawResponse(
      result.randomPointDraw,
      unselectedAmounts,
      result.points,
    );
  } catch (error) {
    // 중복 요청
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const alreadyUsedError = new Error(
        "현재 시간대의 랜덤 포인트 기회를 이미 사용했습니다.",
      );
      alreadyUsedError.status = 409;
      alreadyUsedError.code = "RANDOM_BOX_ALREADY_USED";
      throw alreadyUsedError;
    } else {
      // 그 외 오류
      throw error;
    }
  }
}

export default {
  getMyPoint,
  createRandomPointDraw,
};
