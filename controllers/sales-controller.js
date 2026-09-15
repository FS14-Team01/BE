import {
  createSaleListing,
  getSaleDetailById,
  getSaleList,
  stopSaleById,
  updateSaleById,
} from "../services/sales-service.js";

export async function getSales(req, res, next) {
  try {
    const saleList = await getSaleList(req.query);

    return res.status(200).json(saleList);
  } catch (error) {
    return next(error);
  }
}

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
