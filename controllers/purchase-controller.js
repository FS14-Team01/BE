import { purchaseSaleById } from "../services/purchase-service.js";

export async function purchaseSale(req, res, next) {
  try {
    const purchaseResult = await purchaseSaleById(
      req.params.saleId,
      req.auth.userId,
      req.body,
    );

    return res.status(201).json(purchaseResult);
  } catch (error) {
    return next(error);
  }
}
