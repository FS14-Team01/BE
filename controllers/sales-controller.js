import {
  getSaleDetailById,
  stopSaleById,
  updateSaleById,
} from "../services/sales-service.js";

export async function getSaleDetail(req, res, next) {
  try {
    const saleDetail = await getSaleDetailById(
      req.params.saleId,
      req.auth.userId,
    );

    return res.status(200).json(saleDetail);
  } catch (error) {
    return next(error);
  }
}

export async function updateSale(req, res, next) {
  try {
    const updatedSale = await updateSaleById(
      req.params.saleId,
      req.auth.userId,
      req.body,
    );

    return res.status(200).json(updatedSale);
  } catch (error) {
    return next(error);
  }
}

export async function stopSale(req, res, next) {
  try {
    const stoppedSale = await stopSaleById(
      req.params.saleId,
      req.auth.userId,
    );

    return res.status(200).json(stoppedSale);
  } catch (error) {
    return next(error);
  }
}
