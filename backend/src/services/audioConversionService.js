import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';
import { storageService } from './storageService.js';
import logger from '../utils/logger.js';

ffmpeg.setFfmpegPath(ffmpegStatic);

class AudioConversionService {
  async convertToWav(inputPath) {
    const outputPath = `${inputPath}.wav`;

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-ar 16000',
          '-ac 1',
          '-c:a pcm_s16le'
        ])
        .save(outputPath)
        .on('end', async () => {
          logger.info(`Successfully converted audio to WAV: ${outputPath}`);
          try {
            await storageService.deleteFile(inputPath);
          } catch (err) {
            logger.warn(`Could not delete original file ${inputPath}: ${err.message}`);
          }
          
          try {
            const fs = await import('fs/promises');
            const stats = await fs.stat(outputPath);
            const durationSeconds = (stats.size - 44) / 32000;
            resolve({ wavPath: outputPath, durationSeconds });
          } catch (err) {
            logger.error(`Error calculating duration: ${err.message}`);
            reject(new ApiError(500, ERROR_CODES.CONVERSION_FAILED, 'Failed to calculate audio duration'));
          }
        })
        .on('error', (err) => {
          logger.error(`Error converting audio: ${err.message}`);
          reject(new ApiError(500, 'Failed to convert audio file', ERROR_CODES.CONVERSION_FAILED));
        });
    });
  }
}

export const audioConversionService = new AudioConversionService();
