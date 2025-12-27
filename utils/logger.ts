import winston from 'winston';
import path from 'path';
import fs from 'fs';
import config from '../config';

// Ensure logs directory exists
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for production
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: config.app.nodeEnv === 'production' ? customFormat : consoleFormat,
  }),
];

// Add file transport in production
if (config.app.nodeEnv === 'production') {
  transports.push(
    new winston.transports.File({
      filename: config.logging.file,
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  transports,
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'rejections.log') })
  ],
  // Exit the process on uncaught exception
  exitOnError: false,
});

export default logger;
