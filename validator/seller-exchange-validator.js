import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";

const EXCHANGE_STATUSES = ["ACCEPTED", "REJECTED", "CANCELLED"];

function validateExchangeStatus(status) {
  if (!EXCHANGE_STATUSES.includes(status)) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }
}

export { validateExchangeStatus };
