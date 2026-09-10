import { findUserById } from "../repositories/user-repository.js";
import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";

async function getMyInfo(userId) {
  const parsedUserId = BigInt(userId);

  const user = await findUserById(parsedUserId);

  if (!user) {
    throw new AppError(ERROR_DEFINITIONS.UNAUTHORIZED);
  }

  const responseUser = {
    id: String(user.id),
    email: user.email,
    nickname: user.nickname,
    points: user.points,
  };

  return responseUser;
}

export { getMyInfo };
