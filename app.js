import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import errorHandler from './middlewares/error-handler.js';
import salesRouter from './routes/sales.routes.js';

const app = express();

// middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json());

// route
app.use('/sales', salesRouter);

app.use(errorHandler);

app.listen(process.env.PORT ?? 3001, () => console.log('Server Started'));
