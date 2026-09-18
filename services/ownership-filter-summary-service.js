import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";
import { findUserById } from "../repositories/user-repository.js";
import { findOwnershipTypesByOwnerId } from "../repositories/ownership-filter-summary-repository.js";

export async function getOwnershipFilterSummary(userId, query = {}) {
  if (
    typeof userId !== "string" ||
    !/^[1-9]\d*$/.test(userId) ||
    BigInt(userId) > 9_223_372_036_854_775_807n
  ) {
    throw new AppError(ERROR_DEFINITIONS.UNAUTHORIZED);
  }

  if (
    !query ||
    typeof query !== "object" ||
    Array.isArray(query) ||
    Object.keys(query).some((key) => key !== "keyword") ||
    (query.keyword !== undefined && typeof query.keyword !== "string")
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const ownerId = BigInt(userId);
  if (!(await findUserById(ownerId))) {
    throw new AppError(ERROR_DEFINITIONS.UNAUTHORIZED);
  }

  const rows = await findOwnershipTypesByOwnerId(
    ownerId,
    query.keyword?.trim() || undefined,
  );

  return rows.reduce(
    (summary, { photoCard }) => {
      summary.totalCount += 1;
      summary.gradeCounts[photoCard.grade] += 1;
      summary.categoryCounts[photoCard.category] += 1;
      return summary;
    },
    {
      totalCount: 0,
      gradeCounts: { COMMON: 0, RARE: 0, SUPER_RARE: 0, LEGENDARY: 0 },
      categoryCounts: { POKEMON: 0, SUPER_MARIO: 0, HELLO_KITTY: 0, DIGIMON: 0 },
    },
  );
}
