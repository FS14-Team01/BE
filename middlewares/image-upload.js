import multer from "multer";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (req, file, cb) =>{
    const isAllowedType = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
    if(isAllowedType) {
      cb(null, true);
    }else{
      cb(null, false);
    }
  }
});
export default upload;