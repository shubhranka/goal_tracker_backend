import { Request, Response, NextFunction } from 'express';
import logger from './logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string) {
    super(message, 500);
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const { statusCode = 500, message } = error;

  // Log error details
  logger.error('Error occurred', {
    error: message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Don't leak error details in production
  const responseMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : message;

  res.status(statusCode).json({
    success: false,
    error: responseMessage,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};
