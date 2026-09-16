import { createExchangeOffer } from "../services/create-exchange-service.js";

export async function postExchangeOffer(req, res, next) {
  try {
    const result = await createExchangeOffer({
      saleId: req.params.saleId,
      userId: req.auth.userId,
      body: req.body,
    });
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
