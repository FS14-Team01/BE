import cors from "cors";
import "dotenv/config";
import express from "express";
import pointRouter from "./routes/point-route.js";

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// route
app.use("/points", pointRouter);

// 테스트용 에러 미들웨어
app.use((error, req, res, next) => {
  const status = error.status ?? 500;
  const code = error.code ?? "INTERNAL_SERVER_ERROR";
  const message = error.message ?? "서버 오류가 발생했습니다.";
  return res.status(status).json({
    code,
    message,
  });
});

app.listen(process.env.PORT ?? 3001, () => console.log("Server Started"));
