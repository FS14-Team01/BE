import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";
import { findMarketSummaryRows } from "../repositories/market-summary-repository.js";

export async function getMarketSummary(query = {}) {
  if (
    !query || typeof query !== "object" || Array.isArray(query) ||
    Object.keys(query).some((key) => key !== "keyword") ||
    (query.keyword !== undefined && typeof query.keyword !== "string")
  ) {
    throw new AppError(ERROR_DEFINITIONS.INVALID_REQUEST);
  }

  const rows = await findMarketSummaryRows(query.keyword?.trim() || undefined);
  return rows.reduce((summary, sale) => {
    summary.totalCount += 1;
    summary.gradeCounts[sale.photoCard.grade] += 1;
    summary.categoryCounts[sale.photoCard.category] += 1;
    summary.statusCounts[sale.status] += 1;
    return summary;
  }, {
    totalCount: 0,
    gradeCounts: { COMMON: 0, RARE: 0, SUPER_RARE: 0, LEGENDARY: 0 },
    categoryCounts: { POKEMON: 0, SUPER_MARIO: 0, HELLO_KITTY: 0, DIGIMON: 0 },
    statusCounts: { ON_SALE: 0, SOLD_OUT: 0 },
  });
}
