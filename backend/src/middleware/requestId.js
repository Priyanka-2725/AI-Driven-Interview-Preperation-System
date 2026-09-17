import { v4 as uuidv4 } from 'uuid';

export const requestId = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
};
