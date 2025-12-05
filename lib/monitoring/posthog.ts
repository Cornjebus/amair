import posthog from 'posthog-js';
import { PostHog } from 'posthog-node';

// =============================================================================
// PostHog Analytics Configuration
// =============================================================================

// Server-side PostHog client
let serverPosthog: PostHog | null = null;

/**
 * Initialize PostHog for client-side analytics
 */
export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.warn('PostHog key not configured');
    return;
  }

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,

    // Session recording
    enable_recording_console_log: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '.sensitive-data',
    },

    // Feature flags
    bootstrap: {
      featureFlags: {},
    },

    // Respect Do Not Track
    respect_dnt: true,

    // Disable in development if needed
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.debug(false);
      }
    },
  });
}

/**
 * Get server-side PostHog client
 */
export function getServerPostHog(): PostHog {
  if (!serverPosthog) {
    if (!process.env.POSTHOG_API_KEY) {
      throw new Error('POSTHOG_API_KEY not configured');
    }

    serverPosthog = new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return serverPosthog;
}

/**
 * Shutdown server PostHog client gracefully
 */
export async function shutdownPostHog() {
  if (serverPosthog) {
    await serverPosthog.shutdown();
    serverPosthog = null;
  }
}

// =============================================================================
// Client-Side Analytics Functions
// =============================================================================

/**
 * Identify a user for analytics
 */
export function identifyUser(
  userId: string,
  properties?: {
    email?: string;
    tier?: string;
    childProfiles?: number;
    storiesCreated?: number;
  }
) {
  if (typeof window === 'undefined') return;

  posthog.identify(userId, {
    ...properties,
    $set_once: {
      first_seen: new Date().toISOString(),
    },
  });
}

/**
 * Reset user identity (on logout)
 */
export function resetUser() {
  if (typeof window === 'undefined') return;
  posthog.reset();
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  if (typeof window === 'undefined') return;
  posthog.capture(eventName, properties);
}

/**
 * Track story generation
 */
export function trackStoryGeneration(properties: {
  storyId: string;
  theme: string;
  mood: string;
  duration: string;
  hasIllustrations: boolean;
  hasNarration: boolean;
  hasVideo: boolean;
  creditsUsed: number;
  generationTimeMs: number;
}) {
  trackEvent('story_generated', properties);
}

/**
 * Track credit purchase
 */
export function trackCreditPurchase(properties: {
  amount: number;
  credits: number;
  tier: string;
  source: 'checkout' | 'upgrade' | 'gift';
}) {
  trackEvent('credits_purchased', {
    ...properties,
    $revenue: properties.amount,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(
  feature: 'story' | 'image' | 'audio' | 'video' | 'character' | 'universe',
  action: 'started' | 'completed' | 'failed',
  metadata?: Record<string, unknown>
) {
  trackEvent(`feature_${feature}_${action}`, metadata);
}

/**
 * Track page view with custom properties
 */
export function trackPageView(properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.capture('$pageview', properties);
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flagKey: string): boolean {
  if (typeof window === 'undefined') return false;
  return posthog.isFeatureEnabled(flagKey) || false;
}

/**
 * Get feature flag value
 */
export function getFeatureFlag(flagKey: string): string | boolean | undefined {
  if (typeof window === 'undefined') return undefined;
  return posthog.getFeatureFlag(flagKey);
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.people.set(properties);
}

/**
 * Increment a user property
 */
export function incrementUserProperty(property: string, value: number = 1) {
  if (typeof window === 'undefined') return;
  posthog.people.set_once({ [property]: 0 });
  // Use set to update the property value
  posthog.capture('$set', { $set: { [property]: value } });
}

// =============================================================================
// Server-Side Analytics Functions
// =============================================================================

/**
 * Track event from server-side
 */
export function serverTrackEvent(
  distinctId: string,
  eventName: string,
  properties?: Record<string, unknown>
) {
  const client = getServerPostHog();
  client.capture({
    distinctId,
    event: eventName,
    properties,
  });
}

/**
 * Identify user from server-side
 */
export function serverIdentifyUser(
  distinctId: string,
  properties?: Record<string, unknown>
) {
  const client = getServerPostHog();
  client.identify({
    distinctId,
    properties,
  });
}

/**
 * Track AI costs for server-side reporting
 */
export function trackAICost(
  userId: string,
  provider: string,
  operation: string,
  cost: number,
  tokens?: { input?: number; output?: number }
) {
  serverTrackEvent(userId, 'ai_cost_incurred', {
    provider,
    operation,
    cost,
    inputTokens: tokens?.input,
    outputTokens: tokens?.output,
  });
}
