import { HTTP_STATUS } from '../constants/index.js'
import { logger } from '../utils/logger.js'

export function errorHandler(err, req, res, _next) {
  logger.error('http', 'Unhandled request error', {
    method: req.method,
    path: req.originalUrl,
    error: err.message || String(err),
  })

  const statusCode = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || 'An unexpected error occurred';
  const errors = err.errors || null;

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors
  });
}
