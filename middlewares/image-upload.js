import multer from "multer";
import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },

  fileFilter: (req, file, cb) => {
    const isAllowedType =
      ALLOWED_IMAGE_TYPES.includes(file.mimetype);

    if (isAllowedType) {
      return cb(null, true);
    }

    return cb(
      new AppError(
        ERROR_DEFINITIONS.INVALID_IMAGE_TYPE
      )
    );
  },
});

export default upload;