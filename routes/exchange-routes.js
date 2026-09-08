import express from 'express'
import { getExchangeOffers } from '../controllers/exchange-controller.js'

const router = express.Router()

router.get('/:saleId/exchange-offers', getExchangeOffers)

export default router
