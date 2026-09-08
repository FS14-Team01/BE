import { Prisma } from "@prisma/client";
import AppError from "../errors/app-error.js";
import bcrypt from "bcrypt";
import {
  findUserByEmail,
  findUserByNickname,
  createUser,
} from "../repositories/user-repository.js";
import { generateAccessToken, generateRefreshToken } from "../lib/token.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9_]+$/;
const BCRYPT_SALT_ROUNDS = 10;

async function signUp(input) {
  // 전달된 값이 null이거나, 전달되지 않았거나, 객체가 아니거나, 배열이라면 거부
  if (
    input === null ||
    input === undefined ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const { email, nickname, password } = input;
  if (
    typeof email !== "string" ||
    typeof nickname !== "string" ||
    typeof password !== "string"
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  // 이메일 및 nickname 공백제거 및 길이, 허용문자 확인
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail.length < 1 || normalizedEmail.length > 254) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }
  if (EMAIL_PATTERN.test(normalizedEmail) === false) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const normalizedNickname = nickname.trim();
  if (normalizedNickname.length < 2 || normalizedNickname.length > 20) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }
  if (NICKNAME_PATTERN.test(normalizedNickname) === false) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  if (password.length < 8 || password.length > 64) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  // bcrypt는 72바이트까지만 해시화하기 때문에 72바이트로 제한
  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  // 동일 이메일 또는 nickname 존재하는지 확인
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser !== null) {
    throw new AppError(ERROR_DEFINITIONS.EMAIL_ALREADY_EXISTS);
  }

  const existingNickname = await findUserByNickname(normalizedNickname);
  if (existingNickname !== null) {
    throw new AppError(ERROR_DEFINITIONS.NICKNAME_ALREADY_EXISTS);
  }

  // 비밀번호 hash화
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // 사용자 생성 중 발생할 수 있는 이메일 및 닉네임 unique 충돌 처리
  let createdUser;

  try {
    createdUser = await createUser({
      email: normalizedEmail,
      nickname: normalizedNickname,
      passwordHash,
    });
  } catch (error) {
    const isUniqueConstraintError =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";

    if (isUniqueConstraintError) {
      const conflictingFields = error.meta?.target;

      const isEmailConflict =
        Array.isArray(conflictingFields) && conflictingFields.includes("email");

      if (isEmailConflict) {
        throw new AppError(ERROR_DEFINITIONS.EMAIL_ALREADY_EXISTS);
      }

      const isNicknameConflict =
        Array.isArray(conflictingFields) &&
        conflictingFields.includes("nickname");

      if (isNicknameConflict) {
        throw new AppError(ERROR_DEFINITIONS.NICKNAME_ALREADY_EXISTS);
      }
    }

    // 중복 외의 오류는 에러 Middleware로 전달
    throw error;
  }

  const accessToken = generateAccessToken(createdUser.id);
  const refreshToken = generateRefreshToken(createdUser.id);

  const responseUser = {
    id: String(createdUser.id),
    email: createdUser.email,
    nickname: createdUser.nickname,
    points: createdUser.points,
    provider: createdUser.provider,
    createdAt: createdUser.createdAt,
  };

  return {
    accessToken,
    refreshToken,
    user: responseUser,
  };
}

export { signUp };
