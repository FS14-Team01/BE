import { getSaleDetailById } from "../services/sales-service.js";

export async function getSaleDetail(req, res, next) {
  try {
    const saleDetail = await getSaleDetailById(req.params.saleId);

    return res.status(200).json(saleDetail);
  } catch (error) {
    return next(error);
  }
}
