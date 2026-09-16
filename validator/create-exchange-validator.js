import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";

const MAX_DATABASE_BIGINT = 9_223_372_036_854_775_807n;

function parseId(value) {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value) ||
    value.length > 19 ||
    BigInt(value) > MAX_DATABASE_BIGINT
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }
  return BigInt(value);
}

export function validateCreateExchangeOffer(saleId, body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some(
      (key) => !["offeredCardId", "offeredDescription"].includes(key),
    ) ||
    (body.offeredDescription != null &&
      typeof body.offeredDescription !== "string")
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  return {
    saleListingId: parseId(saleId),
    offeredCardId: parseId(body.offeredCardId),
    offeredDescription: body.offeredDescription ?? null,
  };
}
