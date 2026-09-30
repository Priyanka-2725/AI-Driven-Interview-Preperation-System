import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';
import Recording from '../models/Recording.js';
import { audioConversionService } from '../services/audioConversionService.js';
import { evaluateRecording } from '../services/mlClient.js';
import { storageService } from '../services/storageService.js';

export const uploadRecording = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    throw new ApiError(400, ERROR_CODES.VALIDATION_ERROR, 'No audio file uploaded');
  }

  let wavPath;
  let durationSeconds;
  
  try {
    // Convert to wav and get duration
    const conversionResult = await audioConversionService.convertToWav(req.file.path);
    wavPath = conversionResult.wavPath;
    durationSeconds = conversionResult.durationSeconds;
  } catch (error) {
    await storageService.deleteFile(req.file.path);
    return next(error);
  }

  if (durationSeconds > 300) {
    await storageService.deleteFile(wavPath);
    return next(new ApiError(400, ERROR_CODES.RECORDING_TOO_LONG, 'Recording duration must be between 1 and 300 seconds'));
  }

  // Create recording document
  let recording = await Recording.create({
    userId: req.user._id,
    originalFilename: req.file.originalname,
    storagePath: wavPath,
    durationSeconds: Number(durationSeconds),
    status: 'processing'
  });

  try {
    // Evaluate recording
    const evaluationResult = await evaluateRecording(wavPath);
    
    // Update recording with results
    recording.status = 'analyzed';
    recording.fluencyResult = evaluationResult.fluency;
    recording.confidenceResult = evaluationResult.confidence;
    recording.analyzedAt = new Date();
    await recording.save();

    res.status(201).json(ApiResponse.success(recording, req.requestId));
  } catch (error) {
    recording.status = 'failed';
    recording.failureReason = error.message;
    await recording.save();
    
    next(error);
  }
});

export const getRecordings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const recordings = await Recording.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await Recording.countDocuments({ userId: req.user._id });

  res.status(200).json(ApiResponse.success({
    recordings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }, req.requestId));
});

export const getRecordingById = asyncHandler(async (req, res) => {
  const recording = await Recording.findOne({ 
    _id: req.params.id, 
    userId: req.user._id 
  });

  if (!recording) {
    throw new ApiError(404, ERROR_CODES.RECORDING_NOT_FOUND, 'Recording not found');
  }

  res.status(200).json(ApiResponse.success(recording, req.requestId));
});

export const deleteRecording = asyncHandler(async (req, res) => {
  const recording = await Recording.findOne({ 
    _id: req.params.id, 
    userId: req.user._id 
  }).select('+storagePath');

  if (!recording) {
    throw new ApiError(404, ERROR_CODES.RECORDING_NOT_FOUND, 'Recording not found');
  }

  // Delete from disk
  if (recording.storagePath) {
    await storageService.deleteFile(recording.storagePath);
  }

  // Delete from DB
  await Recording.deleteOne({ _id: recording._id });

  res.status(200).json(ApiResponse.success(null, req.requestId));
});
