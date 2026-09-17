import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/database.js';
import logger from './utils/logger.js';

const startServer = async () => {
  try {
    await connectDB();
    app.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
