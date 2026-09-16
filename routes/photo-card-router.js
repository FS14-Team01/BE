import upload from "../middlewares/image-upload.js";
import { Router } from "express";
import verifyAccessToken from "../middlewares/auth.js";
import { createPhotoCard } from "../controllers/photo-card-controller.js";

const photoCardRouter = Router();

photoCardRouter.post("/", verifyAccessToken, upload.single("image"), createPhotoCard);

export default photoCardRouter;
