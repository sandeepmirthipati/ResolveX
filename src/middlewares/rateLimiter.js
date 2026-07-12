import rateLimit from 'express-rate-limit'
import { HTTP_STATUS } from '../constants/index.js'

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    errors: null
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login/register requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth attempts, please try again after 15 minutes',
    errors: null
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS
});
