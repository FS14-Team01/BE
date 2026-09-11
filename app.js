import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import errorHandler from "./middlewares/error-handler.js";
import authRouter from "./routes/auth-router.js";
import salesRouter from "./routes/sales-routes.js";
import userRouter from "./routes/user-router.js";
import exchangeRouter from "./routes/exchange-router.js";
import pointRouter from "./routes/point-route.js";
import notificationRouter from "./routes/notification-route.js";

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
app.use("/users", userRouter);
app.use("/exchange-offers", exchangeRouter);
app.use("/points", pointRouter);
app.use("/notifications", notificationRouter);

// error middleware
app.use(errorHandler);

app.listen(process.env.PORT ?? 3001, () => {
  console.log("Server Started");
});
