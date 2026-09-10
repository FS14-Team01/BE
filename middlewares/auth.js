// Router 파일에서 사용 예시:
// 인증이 필요한 Router에서 verifyAccessToken을 import합니다.
// router.post("/", verifyAccessToken, controller);
// 인증 성공 후 Controller에서 req.auth.userId로 로그인 사용자 ID를 읽습니다.
// req.auth.userId는 문자열입니다.

import { expressjwt } from "express-jwt";
import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const MAX_DATABASE_BIGINT = 9_223_372_036_854_775_807n;

const verifyAccessToken = [
  expressjwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
    requestProperty: "auth",
  }),
  validateAccessTokenPayload,
];

function validateAccessTokenPayload(req, res, next) {
  const userId = req.auth?.userId;
  const isInvalidUserId =
    typeof userId !== "string" || !POSITIVE_INTEGER_PATTERN.test(userId);

  if (isInvalidUserId) {
    return next(new AppError(ERROR_DEFINITIONS.UNAUTHORIZED));
  }

  const parsedUserId = BigInt(userId);
  if (parsedUserId > MAX_DATABASE_BIGINT) {
    return next(new AppError(ERROR_DEFINITIONS.UNAUTHORIZED));
  }

  return next();
}

export default verifyAccessToken;
