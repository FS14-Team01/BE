import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";
import cloudinary from "../config/cloudinary.js";
import {
  countCreatedPhotoCards,
  createPhotoCardWithOwnership,
} from "../repositories/photo-card-repository.js";

const ALLOWED_GRADES = [
  "COMMON",
  "RARE",
  "SUPER_RARE",
  "LEGENDARY",
];

const ALLOWED_CATEGORIES = [
  "POKEMON",
  "SUPER_MARIO",
  "HELLO_KITTY",
  "DIGIMON",
];

function getStartOfWeekKST() {
  // 현재 시간
  const now = new Date();

  // KST(UTC+9) 기준으로 변환
  const kstNow = new Date(
    now.getTime() + 9 * 60 * 60 * 1000
  );

  // 일: 0 ~ 토: 6
  const day = kstNow.getUTCDay();

  // 이번 주 월요일까지 빼야 하는 날짜
  const diffToMonday = day === 0 ? 6 : day - 1;

  const startOfWeek = new Date(kstNow);

  // 이번 주 월요일로 이동
  startOfWeek.setUTCDate(
    startOfWeek.getUTCDate() - diffToMonday
  );

  // 월요일 00:00
  startOfWeek.setUTCHours(0, 0, 0, 0);

  // 실제 UTC Date로 변환
  return new Date(
    startOfWeek.getTime() - 9 * 60 * 60 * 1000
  );
}

export async function createPhotoCardService(
  userId,
  data,
  imageFile
) {
  const {
    name,
    grade,
    category,
    description,
    totalSupply,
  } = data;

  const parsedTotalSupply = Number(totalSupply);

  // 이미지 필수
  if (!imageFile) {
    throw new AppError(
      ERROR_DEFINITIONS.INVALID_REQUEST
    );
  }

  // 필수값 검사
  if (!name || !grade || !category || !totalSupply) {
    throw new AppError(
      ERROR_DEFINITIONS.INVALID_REQUEST
    );
  }

  // 발행 수량 검사
  if (
    !Number.isInteger(parsedTotalSupply) ||
    parsedTotalSupply < 1 ||
    parsedTotalSupply > 10
  ) {
    throw new AppError(
      ERROR_DEFINITIONS.INVALID_PHOTO_CARD_SUPPLY
    );
  }

  // 등급 검사
  if (!ALLOWED_GRADES.includes(grade)) {
    throw new AppError(
      ERROR_DEFINITIONS.INVALID_REQUEST
    );
  }

  // 카테고리 검사
  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new AppError(
      ERROR_DEFINITIONS.INVALID_REQUEST
    );
  }

  // 이번 주 생성 횟수 확인
  const startOfWeek = getStartOfWeekKST();

  const createdCount = await countCreatedPhotoCards(
    userId,
    startOfWeek
  );

  if (createdCount >= 3) {
    throw new AppError(
      ERROR_DEFINITIONS.PHOTO_CARD_CREATION_LIMIT_EXCEEDED
    );
  }

  // Cloudinary 이미지 업로드
  const uploadResult = await new Promise(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          (error, result) => {
            if (error) {
              return reject(error);
            }

            resolve(result);
          }
        );

      uploadStream.end(imageFile.buffer);
    }
  );

  const imageUrl = uploadResult.secure_url;

  // 포토카드 + 소유권 생성
  const result =
    await createPhotoCardWithOwnership({
      userId,
      name,
      imageUrl,
      grade,
      category,
      description,
      totalSupply: parsedTotalSupply,
    });

  // Prisma BigInt → JSON 응답용 문자열 변환
  return {
    photoCard: {
      ...result.photoCard,
      id: result.photoCard.id.toString(),
      creatorId: result.photoCard.creatorId.toString(),
    },

    ownership: {
      ...result.ownership,
      id: result.ownership.id.toString(),
      ownerId: result.ownership.ownerId.toString(),
      photoCardId: result.ownership.photoCardId.toString(),
    },
  };
}