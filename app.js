import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import errorHandler from "./middlewares/error-handler.js";
import authRouter from "./routes/auth-router.js";
import salesRouter from "./routes/sales-routes.js";

const app = express();

// middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// route
app.use("/auth", authRouter);
app.use("/sales", salesRouter);

// error middleware
app.use(errorHandler);

app.listen(process.env.PORT ?? 3001, () => {
  console.log("Server Started");
});
