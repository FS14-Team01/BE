import cors from 'cors';
import 'dotenv/config';
import express from 'express';

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// route
app.listen(process.env.PORT ?? 3001, () => console.log('Server Started'));