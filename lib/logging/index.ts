// =============================================================================
// Structured Logging Utility
// =============================================================================
// Provides consistent, secure logging across the application
// - Redacts sensitive data
// - Supports log levels
// - Adds structured metadata

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  action?: string;
  requestId?: string;
  [key: string]: unknown;
}

// Sensitive patterns to redact
const SENSITIVE_PATTERNS = [
  /sk_[a-zA-Z0-9_]+/g, // Stripe secret keys
  /sk-[a-zA-Z0-9-_]+/g, // OpenAI/Anthropic keys
  /whsec_[a-zA-Z0-9_]+/g, // Webhook secrets
  /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, // JWTs
  /password['":\s]*['"]\S+['"]/gi, // Password fields
  /api[_-]?key['":\s]*['"]\S+['"]/gi, // API keys in JSON
  /secret['":\s]*['"]\S+['"]/gi, // Secret fields
  /token['":\s]*['"]\S+['"]/gi, // Token fields
];

// Sensitive keys to redact from objects
const SENSITIVE_KEYS = [
  'password',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
  'stripe_customer_id',
  'clerk_id',
];

/**
 * Redact sensitive information from a string
 */
function redactString(str: string): string {
  let result = str;
  for (const pattern of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

/**
 * Redact sensitive information from an object
 */
function redactObject(obj: unknown, depth = 0): unknown {
  if (depth > 10) return '[MAX_DEPTH]';

  if (typeof obj === 'string') {
    return redactString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item, depth + 1));
  }

  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactObject(value, depth + 1);
      }
    }
    return result;
  }

  return obj;
}

/**
 * Format log entry for structured output
 */
function formatLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): string {
  const timestamp = new Date().toISOString();
  const env = process.env.NODE_ENV || 'development';

  const entry = {
    timestamp,
    level,
    message: redactString(message),
    env,
    ...(context && { context: redactObject(context) }),
    ...(error && {
      error: {
        name: error.name,
        message: redactString(error.message),
        stack: env === 'development' ? error.stack : undefined,
      },
    }),
  };

  // In production, output JSON for log aggregators
  if (env === 'production') {
    return JSON.stringify(entry);
  }

  // In development, output readable format
  const contextStr = context ? ` ${JSON.stringify(redactObject(context))}` : '';
  const errorStr = error ? ` Error: ${error.message}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}${errorStr}`;
}

/**
 * Main logger object
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLogEntry('debug', message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    console.info(formatLogEntry('info', message, context));
  },

  warn(message: string, context?: LogContext): void {
    console.warn(formatLogEntry('warn', message, context));
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : undefined;
    console.error(formatLogEntry('error', message, context, err));
  },
};

/**
 * Create a child logger with preset context
 */
export function createLogger(baseContext: LogContext) {
  return {
    debug(message: string, context?: LogContext): void {
      logger.debug(message, { ...baseContext, ...context });
    },

    info(message: string, context?: LogContext): void {
      logger.info(message, { ...baseContext, ...context });
    },

    warn(message: string, context?: LogContext): void {
      logger.warn(message, { ...baseContext, ...context });
    },

    error(message: string, error?: Error | unknown, context?: LogContext): void {
      logger.error(message, error, { ...baseContext, ...context });
    },
  };
}

/**
 * Safe error message for client responses
 * Never expose internal error details
 */
export function getSafeErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  // List of safe, user-friendly error messages that can be passed through
  const safeMessages = [
    'Unauthorized',
    'User not found',
    'Story not found',
    'Invalid request',
    'Rate limit exceeded',
    'Subscription required',
    'Insufficient credits',
    'Invalid gift code',
    'Gift code already redeemed',
    'Gift code expired',
    'Package not found',
  ];

  if (error instanceof Error) {
    // Check if it's a safe message to expose
    if (safeMessages.some((msg) => error.message.includes(msg))) {
      return error.message;
    }
  }

  return fallback;
}

export default logger;
