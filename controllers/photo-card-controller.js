import { createPhotoCardService } from "../services/photo-card-service.js";

export async function createPhotoCard(req, res, next) {
  try {
    const result = await createPhotoCardService(
      req.auth.userId,
      req.body,
      req.file
    );

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}