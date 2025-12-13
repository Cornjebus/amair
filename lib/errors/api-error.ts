// =============================================================================
// Structured API Error Handling
// =============================================================================

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { captureError } from '@/lib/monitoring/sentry';

/**
 * API Error class with proper typing and safe message handling
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  // Common error factory methods
  static badRequest(message: string = 'Invalid request'): ApiError {
    return new ApiError(message, 400, 'BAD_REQUEST');
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Access denied'): ApiError {
    return new ApiError(message, 403, 'FORBIDDEN');
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(message, 404, 'NOT_FOUND');
  }

  static conflict(message: string = 'Resource already exists'): ApiError {
    return new ApiError(message, 409, 'CONFLICT');
  }

  static tooManyRequests(message: string = 'Too many requests'): ApiError {
    return new ApiError(message, 429, 'RATE_LIMITED');
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(message, 500, 'INTERNAL_ERROR', false);
  }

  static paymentRequired(message: string = 'Payment required'): ApiError {
    return new ApiError(message, 402, 'PAYMENT_REQUIRED');
  }
}

/**
 * Safe error messages that can be exposed to clients
 */
const SAFE_ERROR_MESSAGES: Record<string, string> = {
  BAD_REQUEST: 'Invalid request parameters',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'You do not have permission to access this resource',
  NOT_FOUND: 'The requested resource was not found',
  CONFLICT: 'This resource already exists',
  RATE_LIMITED: 'Too many requests. Please try again later',
  PAYMENT_REQUIRED: 'Payment or subscription required',
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again later',
};

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(
  error: unknown,
  context?: { action?: string; userId?: string; [key: string]: unknown }
): NextResponse {
  // Handle known ApiError
  if (error instanceof ApiError) {
    logger.error(`API Error: ${error.message}`, error, {
      action: context?.action,
      statusCode: error.statusCode,
      code: error.code,
    });

    // Only capture non-operational errors to Sentry
    if (!error.isOperational) {
      captureError(error, context);
    }

    return NextResponse.json(
      {
        error: error.isOperational ? error.message : SAFE_ERROR_MESSAGES[error.code],
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  // Handle unknown errors
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Unhandled API Error', error, context);
  captureError(error instanceof Error ? error : new Error(message), context);

  return NextResponse.json(
    {
      error: SAFE_ERROR_MESSAGES.INTERNAL_ERROR,
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandling<T>(
  handler: (req: Request, context?: T) => Promise<NextResponse>,
  actionName: string
) {
  return async (req: Request, context?: T): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error, { action: actionName });
    }
  };
}

export default ApiError;
