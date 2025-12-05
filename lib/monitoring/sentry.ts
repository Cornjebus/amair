import * as Sentry from '@sentry/nextjs';

// =============================================================================
// Sentry Error Monitoring Configuration
// =============================================================================

/**
 * Initialize Sentry for error tracking
 * Called in instrumentation.ts
 */
export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn('Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Error sampling
    sampleRate: 1.0,

    // Session replay (optional)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Integrations
    integrations: [
      Sentry.replayIntegration(),
    ],

    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Remove sensitive user data
      if (event.user) {
        delete event.user.ip_address;
      }

      return event;
    },

    // Ignore common non-actionable errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      /^Network request failed$/,
      /^AbortError$/,
    ],
  });
}

/**
 * Capture an error with context
 */
export function captureError(
  error: Error,
  context?: {
    userId?: string;
    action?: string;
    metadata?: Record<string, unknown>;
  }
) {
  Sentry.withScope((scope) => {
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }

    if (context?.action) {
      scope.setTag('action', context.action);
    }

    if (context?.metadata) {
      scope.setExtras(context.metadata);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture a message with context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureMessage(message, level);
  });
}

/**
 * Set user context for Sentry
 */
export function setUser(user: { id: string; email?: string; tier?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    tier: user.tier,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Create a breadcrumb for action tracking
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startInactiveSpan({ name, op });
}

/**
 * Track AI provider usage for cost monitoring
 */
export function trackAIUsage(
  provider: 'openai' | 'anthropic' | 'elevenlabs' | 'sora' | 'runway',
  operation: string,
  tokens?: { input?: number; output?: number },
  cost?: number
) {
  Sentry.addBreadcrumb({
    message: `AI Usage: ${provider} - ${operation}`,
    category: 'ai.usage',
    data: {
      provider,
      operation,
      inputTokens: tokens?.input,
      outputTokens: tokens?.output,
      estimatedCost: cost,
    },
    level: 'info',
  });

  // Also send as a metric if cost tracking is needed
  if (cost) {
    Sentry.setMeasurement(`ai.${provider}.cost`, cost, 'dollar');
  }
}

/**
 * Error boundary wrapper for React components
 * Note: Import and use in a .tsx file for proper JSX support
 */
export function createErrorBoundaryConfig(fallback?: React.ReactNode) {
  return {
    fallback: fallback || 'Something went wrong',
    showDialog: process.env.NODE_ENV === 'production',
  };
}
