import './src/config/env.js'
import app from './src/app.js'
import { logger } from './src/utils/logger.js'


const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info('server', 'ResolveX Server started', {
    mode: process.env.NODE_ENV || 'development',
    url: `http://localhost:${PORT}`,
  })
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, _promise) => {
  logger.error('server', 'Unhandled rejection', { error: err.message || String(err) })
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('server', 'Uncaught exception', { error: err.message || String(err) })
  server.close(() => process.exit(1));
});
