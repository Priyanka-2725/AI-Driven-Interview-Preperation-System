import { env } from '../config/env.js';

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = levels[env.LOG_LEVEL || 'info'];

const formatMessage = (level, message, ...meta) => {
  const timestamp = new Date().toISOString();
  // Extract requestId if passed inside meta
  let reqId = '';
  if (meta.length > 0 && typeof meta[0] === 'object' && meta[0]?.requestId) {
    reqId = ` [${meta[0].requestId}]`;
    meta = meta.slice(1);
  }
  return `${timestamp} [${level.toUpperCase()}]${reqId} ${message} ${meta.length ? JSON.stringify(meta) : ''}`.trim();
};

export default {
  debug: (message, ...meta) => {
    if (levels.debug >= currentLevel) console.debug(formatMessage('debug', message, ...meta));
  },
  info: (message, ...meta) => {
    if (levels.info >= currentLevel) console.info(formatMessage('info', message, ...meta));
  },
  warn: (message, ...meta) => {
    if (levels.warn >= currentLevel) console.warn(formatMessage('warn', message, ...meta));
  },
  error: (message, ...meta) => {
    if (levels.error >= currentLevel) console.error(formatMessage('error', message, ...meta));
  }
};
