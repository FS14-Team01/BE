import {
  cancelMyExchangeOffer,
  getMyExchangeOffers,
} from "../services/requester-exchange-service.js";

export async function getRequesterExchangeOffers(req, res, next) {
  try {
    return res
      .status(200)
      .json(await getMyExchangeOffers(req.auth.userId, req.query));
  } catch (error) {
    next(error);
  }
}

export async function cancelRequesterExchange(req, res, next) {
  // 판매자 승인·거절은 기존 컨트롤러에 그대로 맡긴다.
  if (req.body?.status !== "CANCELLED") return next();
  try {
    const result = await cancelMyExchangeOffer({
      exchangeOfferId: req.params.exchangeOfferId,
      userId: req.auth.userId,
      body: req.body,
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
