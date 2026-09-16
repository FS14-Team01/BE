import {
  getMyOwnerships as getMyOwnershipsService,
} from "../services/ownership-service.js";
import { getMyInfo as getMyInfoService } from "../services/user-service.js";
import { getOwnershipFilterSummary } from "../services/ownership-filter-summary-service.js";
import {
  getSalesBySellerId,
  getSaleSummaryBySellerId,
} from "../services/sales-service.js";

export async function getMyInfo(req, res, next) {
  try {
    const user = await getMyInfoService(req.auth.userId);

    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

export async function getMyOwnerships(req, res, next) {
  try {
    const ownerships = await getMyOwnershipsService(
      req.auth.userId,
      req.query,
    );

    return res.status(200).json(ownerships);
  } catch (error) {
    return next(error);
  }
}

export async function getMySales(req, res, next) {
  try {
    const sales = await getSalesBySellerId(req.auth.userId, req.query);

    return res.status(200).json(sales);
  } catch (error) {
    return next(error);
  }
}

export async function getMyOwnershipFilterSummary(req, res, next) {
  try {
    const summary = await getOwnershipFilterSummary(req.auth.userId, req.query);
    return res.status(200).json(summary);
  } catch (error) {
    return next(error);
  }
}

export async function getMySalesSummary(req, res, next) {
  try {
    const summary = await getSaleSummaryBySellerId(req.auth.userId);

    return res.status(200).json(summary);
  } catch (error) {
    return next(error);
  }
}
