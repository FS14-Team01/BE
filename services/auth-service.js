import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import AppError from "../errors/app-error.js";
import bcrypt from "bcrypt";
import {
  findUserByEmail,
  findUserByNickname,
  createUser,
  findUserById,
} from "../repositories/user-repository.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../lib/token.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9_]+$/;
const BCRYPT_SALT_ROUNDS = 10;
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const MAX_DATABASE_BIGINT = 9_223_372_036_854_775_807n;

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

    if (!isUniqueConstraintError) {
      throw error;
    }

    // 사전 중복 검사 이후 동시에 가입 요청이 처리될 수 있으므로
    // db의 unique 제약 오류가 발생하면 실제 중복 값을 다시 확인
    const userWithSameEmail = await findUserByEmail(normalizedEmail);

    if (userWithSameEmail !== null) {
      throw new AppError(ERROR_DEFINITIONS.EMAIL_ALREADY_EXISTS);
    }

    const userWithSameNickname = await findUserByNickname(normalizedNickname);

    if (userWithSameNickname !== null) {
      throw new AppError(ERROR_DEFINITIONS.NICKNAME_ALREADY_EXISTS);
    }

    // 이메일이나 nickname 외의 unique 오류는 그대로 전달
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

// 로그인 입력값 검증
async function login(input) {
  if (
    input === null ||
    input === undefined ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const { email, password } = input;
  if (typeof email !== "string" || typeof password !== "string") {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const isPasswordTooLong =
    password.length > 64 || Buffer.byteLength(password, "utf-8") > 72;
  if (isPasswordTooLong) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_CREDENTIALS);
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail.length < 1 || normalizedEmail.length > 254) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }
  if (EMAIL_PATTERN.test(normalizedEmail) === false) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  // 유저 이메일 존재하는지 검증
  const user = await findUserByEmail(normalizedEmail);

  if (!user || user.provider !== "EMAIL" || !user.passwordHash) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_CREDENTIALS);
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordCorrect) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_CREDENTIALS);
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const responseUser = {
    id: String(user.id),
    email: user.email,
    nickname: user.nickname,
    points: user.points,
    provider: user.provider,
    createdAt: user.createdAt,
  };

  return {
    accessToken,
    refreshToken,
    user: responseUser,
  };
}

// Refresh Access Token
async function refreshAccessToken(refreshToken) {
  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REFRESH_TOKEN);
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(ERROR_DEFINITIONS.REFRESH_TOKEN_EXPIRED);
    }
    throw new AppError(ERROR_DEFINITIONS.INVALID_REFRESH_TOKEN);
  }

  const userId = payload?.userId;
  const isInvalidUserId =
    typeof userId !== "string" || !POSITIVE_INTEGER_PATTERN.test(userId);

  if (isInvalidUserId) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REFRESH_TOKEN);
  }

  const parsedUserId = BigInt(userId);
  if (parsedUserId > MAX_DATABASE_BIGINT) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REFRESH_TOKEN);
  }

  const user = await findUserById(parsedUserId);
  if (user === null) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REFRESH_TOKEN);
  }

  const accessToken = generateAccessToken(user.id);
  return { accessToken };
}

export { signUp, login, refreshAccessToken };
