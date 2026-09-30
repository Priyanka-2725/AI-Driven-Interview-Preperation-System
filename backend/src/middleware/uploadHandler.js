import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';

const uploadDir = path.join(process.cwd(), 'uploads', 'recordings');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `recording-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'audio/webm' || file.mimetype === 'audio/ogg') {
    cb(null, true);
  } else {
    cb(new ApiError(400, ERROR_CODES.UNSUPPORTED_AUDIO_FORMAT, 'Only audio/webm and audio/ogg are supported'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  }
});

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(413, ERROR_CODES.RECORDING_TOO_LARGE, 'File size exceeds the 50MB limit'));
    }
    return next(new ApiError(400, ERROR_CODES.VALIDATION_ERROR, err.message));
  } else if (err) {
    return next(err);
  }
  next();
};
