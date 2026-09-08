import jwt from "jsonwebtoken";

function generateAccessToken(userId) {
  // DB스키마에서 BigInt를 사용하기로 했기에 String으로 변환
  const stringUserId = String(userId);

  // payload에 문자열로 된 userId를 담음
  const payload = { userId: stringUserId };

  // payload, jwt시크릿키, 그리고 옵션으로 expire 시간 설정해서 sign
  // expire 시간은 .env 파일에서 관리
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
  });
}

function verifyAccessToken(accessToken) {
  return jwt.verify(accessToken, process.env.JWT_SECRET);
}

function generateRefreshToken(userId) {
  const stringUserId = String(userId);
  const payload = { userId: stringUserId };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  });
}

function verifyRefreshToken(refreshToken) {
  return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
}

export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
