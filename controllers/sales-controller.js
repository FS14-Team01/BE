import {
  createSaleListing,
  getSaleDetailById,
} from "../services/sales-service.js";

export async function createSale(req, res, next) {
  try {
    const sale = await createSaleListing(req.auth.userId, req.body);

    return res.status(201).json(sale);
  } catch (error) {
    return next(error);
  }
}

export async function getSaleDetail(req, res, next) {
  try {
    const saleDetail = await getSaleDetailById(req.params.saleId);

    return res.status(200).json(saleDetail);
  } catch (error) {
    return next(error);
  }
}
