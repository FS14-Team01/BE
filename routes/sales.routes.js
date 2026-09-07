import { Router } from 'express';
import { getSaleDetail } from '../controllers/sales.controller.js';

const salesRouter = Router();

salesRouter.get('/:saleId', getSaleDetail);

export default salesRouter;
