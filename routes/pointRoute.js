import express from 'express';
import pointController from '../controllers/pointController.js';
import mockAuth from '../middlewares/mockAuth.js';

const router = express.Router();

router.use(mockAuth);
router.get('/me', pointController.getMyPoint);
router.post('/random-draws', pointController.createRandomPointDraw);

export default router ;