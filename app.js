import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import notificationRouter from './routes/notification-route.js';

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// 테스트용 인증 미들웨어 - 지우기
app.use((req, res, next) => {
  req.user = {
    id: 11,
  };

  next();
});

// route
app.use('/notifications', notificationRouter);

// 테스트용 에러핸들러 - 지우기
app.use((err, req, res, next) => {
  return res.status(500).json({ message: err.message });
})

app.listen(process.env.PORT ?? 3001, () => console.log('Server Started'));