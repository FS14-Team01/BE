import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";

export function parseExchangeId(value) {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value) ||
    value.length > 19 ||
    BigInt(value) > 9_223_372_036_854_775_807n
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }
  return BigInt(value);
}

export function validateCancelExchange(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    body.status !== "CANCELLED" ||
    Object.keys(body).some((key) => key !== "status")
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }
}

export function validateMyExchangeQuery(query) {
  if (
    Object.keys(query).some(
      (key) => !["cursor", "limit", "saleId"].includes(key),
    )
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }
  const limit =
    query.limit === undefined ? 12 : Number(parseExchangeId(query.limit));
  if (limit > 12) throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  return {
    limit,
    saleId:
      query.saleId === undefined ? undefined : parseExchangeId(query.saleId),
    cursor:
      query.cursor === undefined ? undefined : parseExchangeId(query.cursor),
  };
}
