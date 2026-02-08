import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}-${file.originalname}`);
    }
  }),
  limits: {
    files: 10,
    fileSize: 20 * 1024 * 1024
  }
});

export const MAX_FILES = 10;
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
