import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { upload, handleUploadError } from '../middleware/uploadHandler.js';
import { validatePagination, validateRecordingUpload } from '../validators/recordingValidators.js';
import {
  uploadRecording,
  getRecordings,
  getRecordingById,
  deleteRecording
} from '../controllers/recordingController.js';

const router = Router();

router.use(authenticate);

router.post('/', 
  upload.single('audio'),
  handleUploadError,
  uploadRecording
);

router.get('/', validatePagination, getRecordings);
router.get('/:id', getRecordingById);
router.delete('/:id', deleteRecording);

export default router;
