import fs from 'fs/promises';
import logger from '../utils/logger.js';

class StorageService {
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(`Deleted file: ${filePath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error(`Failed to delete file: ${filePath}`, error);
        throw error;
      }
    }
  }
}

export const storageService = new StorageService();
