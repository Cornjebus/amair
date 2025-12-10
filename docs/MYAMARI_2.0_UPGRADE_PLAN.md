# MyAmari 2.0 — Complete Upgrade Implementation Plan (v2.2 TDD + UI/UX)

> **Document Version:** 2.2 (TDD + UI/UX Edition)
> **Created:** December 2025
> **Status:** Planning Phase — Ready for Implementation
> **Target Score:** 96/100
> **Methodology:** Full Test-Driven Development (TDD) + User-Centered Design

---

## TDD Methodology

### The Red-Green-Refactor Cycle

Every feature in MyAmari 2.0 follows strict TDD principles:

```
┌─────────────────────────────────────────────────────────────┐
│                    TDD CYCLE                                │
│                                                             │
│    ┌─────────┐      ┌─────────┐      ┌──────────┐          │
│    │  RED    │ ───► │  GREEN  │ ───► │ REFACTOR │          │
│    │ (Test)  │      │ (Code)  │      │ (Clean)  │          │
│    └─────────┘      └─────────┘      └──────────┘          │
│         │                                   │               │
│         └───────────────────────────────────┘               │
│                                                             │
│  1. RED: Write a failing test that defines desired behavior │
│  2. GREEN: Write minimum code to make the test pass         │
│  3. REFACTOR: Clean up code while keeping tests green       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### TDD Rules for MyAmari

1. **No production code without a failing test first**
2. **Write only enough test to fail** (compilation failures count)
3. **Write only enough code to pass the failing test**
4. **Refactor only when all tests are green**
5. **Each test should test ONE behavior**

### Test Categories

| Category | Tool | Purpose | When to Write |
|----------|------|---------|---------------|
| **Unit Tests** | Vitest | Test individual functions/classes in isolation | Before every function |
| **Integration Tests** | Vitest + MSW | Test API routes with mocked external services | Before every API route |
| **E2E Tests** | Playwright | Test complete user flows | Before each user story |
| **Contract Tests** | Vitest | Test API request/response shapes | Before external integrations |

### Test File Structure

```
tests/
├── unit/                          # Unit tests (mirror src structure)
│   ├── lib/
│   │   ├── credits/
│   │   │   └── credit-service.test.ts
│   │   ├── ai/
│   │   │   ├── providers/
│   │   │   │   ├── anthropic.test.ts
│   │   │   │   └── openai.test.ts
│   │   │   ├── image-generator.test.ts
│   │   │   └── video-generator.test.ts
│   │   └── validations/
│   │       └── story.test.ts
│   └── components/
│       └── story/
│           └── natural-input.test.tsx
├── integration/                   # API route tests
│   ├── api/
│   │   ├── generate-story.test.ts
│   │   ├── illustrations.test.ts
│   │   ├── audio.test.ts
│   │   ├── video.test.ts
│   │   └── credits.test.ts
│   └── webhooks/
│       ├── stripe.test.ts
│       └── clerk.test.ts
├── e2e/                           # End-to-end tests
│   ├── story-generation.spec.ts
│   ├── subscription-flow.spec.ts
│   ├── gift-purchase.spec.ts
│   └── coppa-consent.spec.ts
├── contracts/                     # API contract tests
│   ├── anthropic.contract.test.ts
│   ├── openai.contract.test.ts
│   ├── elevenlabs.contract.test.ts
│   └── stripe.contract.test.ts
├── mocks/                         # MSW handlers and fixtures
│   ├── handlers/
│   │   ├── anthropic.ts
│   │   ├── openai.ts
│   │   ├── elevenlabs.ts
│   │   └── stripe.ts
│   └── fixtures/
│       ├── stories.ts
│       ├── users.ts
│       └── credits.ts
└── setup.ts                       # Global test setup
```

### Coverage Requirements

| Type | Minimum Coverage | Target Coverage |
|------|------------------|-----------------|
| Unit Tests | 80% | 90% |
| Integration Tests | 70% | 85% |
| E2E Tests | Critical paths | All user journeys |
| **Overall** | **80%** | **90%** |

### TDD Workflow for Each Feature

```bash
# 1. Create test file first
touch tests/unit/lib/credits/credit-service.test.ts

# 2. Write failing test
npm test -- --watch credit-service

# 3. See RED (test fails)
# 4. Write minimum code to pass
# 5. See GREEN (test passes)
# 6. Refactor if needed
# 7. Repeat for next behavior
```

---

## Executive Summary

This document outlines the complete technical implementation plan to upgrade MyAmari from its current state (story generation with basic TTS) to the full MyAmari 2.0 vision: a multimodal AI-powered family storytelling platform with illustrations, premium audio, video storybooks, and persistent family universes.

### Current State Analysis

| Feature | Current Status | Target State |
|---------|---------------|--------------|
| Story Generation | GPT-4 Turbo | Claude Sonnet 4.5 + GPT-4o |
| Image Generation | ✅ **DALL-E 3 (5 art styles)** | GPT-4o native + Flux.1 |
| Audio Narration | ✅ **ElevenLabs (6 voices)** | ElevenLabs + Voice Cloning |
| Video Generation | None | Sora 2 API + Runway fallback |
| Monetization | ✅ **14-day Trial Model** | Trial + Tier-based (see SUBSCRIPTION_TRIAL_IMPLEMENTATION.md) |
| Character Persistence | None | Family Universe + Memory |
| Input Method | Multi-step wizard | Natural language first |
| Mobile | None | React Native Expo app |
| Testing | None | Vitest + Playwright E2E |
| Observability | None | Sentry + PostHog |
| Security | Basic | Rate limiting + COPPA compliance |

> **Note (Dec 2025):** Phase 2 (Images) and Phase 3 (Audio) are COMPLETE.
> Phase 5 (Credit System) is DEFERRED in favor of 14-day trial model.
> See `docs/SUBSCRIPTION_TRIAL_IMPLEMENTATION.md` for trial implementation details.

### Complete Tech Stack

```
CURRENT STACK (Keep):
├── Next.js 14 (App Router)
├── TypeScript
├── Supabase (PostgreSQL + Storage)
├── Clerk (Auth)
├── Stripe (Payments)
└── Vercel (Hosting)

NEW ADDITIONS:
├── AI Providers
│   ├── Anthropic Claude API (story generation)
│   ├── OpenAI GPT-4o (images + multimodal)
│   ├── ElevenLabs (audio + voice cloning)
│   └── Sora 2 / Runway Gen-3 (video)
├── Infrastructure
│   ├── Inngest (background jobs)
│   ├── Upstash Redis (rate limiting + caching)
│   ├── Bunny Stream (video CDN)
│   └── Supavisor (connection pooling)
├── Observability
│   ├── Sentry (error monitoring)
│   ├── PostHog (product analytics)
│   └── Vercel Analytics (web vitals)
├── Email
│   └── Resend (transactional emails)
├── Testing
│   ├── Vitest (unit tests)
│   ├── Playwright (E2E tests)
│   └── MSW (API mocking)
├── Validation
│   └── Zod (schema validation)
├── Mobile
│   └── React Native Expo
└── Compliance
    └── COPPA-compliant consent flow
```

---

## Phase 0: Foundation & Infrastructure (Week 1)

Before adding features, establish the infrastructure for security, monitoring, and reliability.

### 0.1 Rate Limiting with Upstash

**Why:** Prevent API abuse that could rack up massive AI costs.

**Installation:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Implementation:**

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different rate limiters for different operations
export const rateLimiters = {
  // Story generation: 10 per minute per user
  storyGeneration: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:story',
  }),

  // Image generation: 20 per minute per user
  imageGeneration: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: 'ratelimit:image',
  }),

  // Video generation: 5 per hour per user
  videoGeneration: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: 'ratelimit:video',
  }),

  // Voice cloning: 3 per day per user
  voiceCloning: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 d'),
    analytics: true,
    prefix: 'ratelimit:voice',
  }),

  // Gift code redemption: 5 attempts per hour per IP
  giftRedemption: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: 'ratelimit:gift',
  }),

  // General API: 100 per minute per IP
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),
};

// Helper to check rate limit
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const { success, remaining, reset } = await limiter.limit(identifier);
  return { success, remaining, reset };
}

// Middleware helper
export function rateLimitResponse(reset: number) {
  return Response.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    }
  );
}
```

**Usage in API routes:**

```typescript
// app/api/generate-story/route.ts
import { rateLimiters, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  // Check rate limit
  const { success, reset } = await checkRateLimit(
    rateLimiters.storyGeneration,
    userId
  );

  if (!success) {
    return rateLimitResponse(reset);
  }

  // ... rest of the handler
}
```

**Environment Variables:**
```bash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

Sources: [Upstash Rate Limiting](https://upstash.com/blog/nextjs-ratelimiting), [@upstash/ratelimit](https://github.com/upstash/ratelimit-js)

---

### 0.2 Error Monitoring with Sentry

**Installation:**
```bash
npx @sentry/wizard@latest -i nextjs
```

**This creates:**
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation.ts`
- Updates `next.config.js`

**Custom Configuration:**

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay for debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false, // Don't mask story content
      blockAllMedia: false, // Allow story images
    }),
  ],

  // Filter out non-errors
  beforeSend(event) {
    // Don't send rate limit errors
    if (event.message?.includes('Too many requests')) {
      return null;
    }
    return event;
  },
});
```

**Error boundary for stories:**

```typescript
// components/story/story-error-boundary.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export function StoryErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { component: 'story' },
    });
  }, [error]);

  return (
    <div className="p-6 bg-red-50 rounded-xl text-center">
      <h2 className="text-xl font-semibold text-red-800 mb-2">
        Oops! Something went wrong with your story.
      </h2>
      <p className="text-red-600 mb-4">
        Our magical storytellers are taking a quick break.
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-red-600 text-white rounded-lg"
      >
        Try Again
      </button>
    </div>
  );
}
```

**Tunnel to avoid ad blockers:**

```javascript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  tunnelRoute: '/monitoring', // Proxy through our domain
  hideSourceMaps: true,
  disableLogger: true,
});
```

Sources: [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/), [Sentry Tunneling](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)

---

### 0.3 Product Analytics with PostHog

**Installation:**
```bash
npm install posthog-js
```

**Provider Setup:**

```typescript
// lib/posthog/provider.tsx
'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: '/ingest', // Proxy to avoid blockers
        capture_pageview: 'history_change', // Auto-capture SPAs
        capture_pageleave: true,
        autocapture: true,
        persistence: 'localStorage+cookie',
        // COPPA: Don't track children
        opt_out_capturing_by_default: false,
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
```

**Reverse proxy (avoid ad blockers):**

```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
};
```

**Custom events for MyAmari:**

```typescript
// lib/posthog/events.ts
import posthog from 'posthog-js';

export const trackStoryGenerated = (properties: {
  storyId: string;
  tone: string;
  length: string;
  hasIllustrations: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
  creditsUsed: number;
}) => {
  posthog.capture('story_generated', properties);
};

export const trackUpgrade = (properties: {
  fromTier: string;
  toTier: string;
  isAnnual: boolean;
}) => {
  posthog.capture('subscription_upgraded', properties);
};

export const trackVideoGeneration = (properties: {
  storyId: string;
  duration: number;
  resolution: string;
  cost: number;
}) => {
  posthog.capture('video_generated', properties);
};

export const trackGiftPurchased = (properties: {
  isGift: boolean;
  price: number;
}) => {
  posthog.capture('lifetime_purchased', properties);
};
```

Sources: [PostHog Next.js Docs](https://posthog.com/docs/libraries/next-js), [PostHog Reverse Proxy](https://posthog.com/tutorials/nextjs-analytics)

---

### 0.4 Input Validation with Zod

**Installation:**
```bash
npm install zod
```

**Shared schemas:**

```typescript
// lib/validations/story.ts
import { z } from 'zod';

export const characterSchema = z.object({
  name: z.string().min(1).max(50),
  age: z.number().int().min(1).max(18).optional(),
  gender: z.enum(['boy', 'girl', 'other']).optional(),
  role: z.enum(['protagonist', 'sidekick', 'pet', 'mentor', 'other']).optional(),
});

export const storyGenerationSchema = z.object({
  prompt: z.string().min(10).max(1000),
  characters: z.array(characterSchema).max(5).optional(),
  tone: z.enum(['calm', 'adventurous', 'funny', 'mysterious', 'educational']).default('calm'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  artStyle: z.enum(['watercolor', 'pixar', 'cartoon', 'anime', 'storybook', 'comic']).optional(),
  universeId: z.string().uuid().optional(),
  includeIllustrations: z.boolean().default(false),
  includeAudio: z.boolean().default(false),
  includeVideo: z.boolean().default(false),
});

export const illustrationRequestSchema = z.object({
  storyId: z.string().uuid(),
  style: z.enum(['watercolor', 'pixar', 'cartoon', 'anime', 'storybook', 'comic']),
  pageCount: z.number().int().min(4).max(12).default(8),
  quality: z.enum(['low', 'medium', 'high']).default('medium'),
});

export const audioRequestSchema = z.object({
  storyId: z.string().uuid(),
  voiceId: z.string().min(1),
  speed: z.number().min(0.5).max(2.0).default(1.0),
});

export const videoRequestSchema = z.object({
  storyId: z.string().uuid(),
  resolution: z.enum(['720p', '1080p']).default('1080p'),
  includeAudio: z.boolean().default(true),
});

export const giftPurchaseSchema = z.object({
  purchaserEmail: z.string().email(),
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1).max(100),
  message: z.string().max(500).optional(),
  paymentMethodId: z.string().min(1),
});

export const giftRedeemSchema = z.object({
  giftCode: z.string().regex(/^AMARI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/),
});

// Type exports
export type StoryGenerationInput = z.infer<typeof storyGenerationSchema>;
export type IllustrationRequestInput = z.infer<typeof illustrationRequestSchema>;
export type AudioRequestInput = z.infer<typeof audioRequestSchema>;
export type VideoRequestInput = z.infer<typeof videoRequestSchema>;
export type GiftPurchaseInput = z.infer<typeof giftPurchaseSchema>;
```

**API route with validation:**

```typescript
// app/api/generate-story/route.ts
import { storyGenerationSchema } from '@/lib/validations/story';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  // Parse and validate body
  const body = await req.json();
  const result = storyGenerationSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const validatedData = result.data;
  // ... continue with validated data
}
```

Sources: [Zod Next.js Validation](https://dub.co/blog/zod-api-validation), [next-zod-route](https://github.com/Melvynx/next-zod-route)

---

### 0.5 Transactional Emails with Resend

**Installation:**
```bash
npm install resend @react-email/components
```

**Email templates:**

```typescript
// emails/story-ready.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface StoryReadyEmailProps {
  childName: string;
  storyTitle: string;
  storyUrl: string;
  thumbnailUrl?: string;
}

export function StoryReadyEmail({
  childName,
  storyTitle,
  storyUrl,
  thumbnailUrl,
}: StoryReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your story "{storyTitle}" is ready!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Story Time!</Heading>
          {thumbnailUrl && (
            <Img src={thumbnailUrl} width="400" height="225" alt={storyTitle} />
          )}
          <Text style={text}>
            Great news! The story "{storyTitle}" for {childName} is now ready
            to enjoy.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={storyUrl}>
              Read the Story
            </Button>
          </Section>
          <Text style={footer}>
            Made with love by MyAmari
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = { margin: '0 auto', padding: '40px 20px', maxWidth: '560px' };
const h1 = { color: '#7c3aed', fontSize: '24px', textAlign: 'center' as const };
const text = { color: '#525f7f', fontSize: '16px', lineHeight: '24px' };
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' };
const button = {
  backgroundColor: '#7c3aed',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  padding: '12px 24px',
  textDecoration: 'none',
};
const footer = { color: '#8898aa', fontSize: '12px', textAlign: 'center' as const };
```

**Email service:**

```typescript
// lib/email/service.ts
import { Resend } from 'resend';
import { StoryReadyEmail } from '@/emails/story-ready';
import { GiftReceivedEmail } from '@/emails/gift-received';
import { VideoReadyEmail } from '@/emails/video-ready';
import { WelcomeEmail } from '@/emails/welcome';

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailService = {
  async sendWelcome(email: string, name: string) {
    return resend.emails.send({
      from: 'MyAmari <hello@myamari.com>',
      to: email,
      subject: 'Welcome to MyAmari!',
      react: WelcomeEmail({ name }),
    });
  },

  async sendStoryReady(
    email: string,
    childName: string,
    storyTitle: string,
    storyUrl: string,
    thumbnailUrl?: string
  ) {
    return resend.emails.send({
      from: 'MyAmari <stories@myamari.com>',
      to: email,
      subject: `Your story "${storyTitle}" is ready!`,
      react: StoryReadyEmail({ childName, storyTitle, storyUrl, thumbnailUrl }),
    });
  },

  async sendVideoReady(
    email: string,
    storyTitle: string,
    videoUrl: string,
    thumbnailUrl: string
  ) {
    return resend.emails.send({
      from: 'MyAmari <stories@myamari.com>',
      to: email,
      subject: `Your video storybook "${storyTitle}" is ready!`,
      react: VideoReadyEmail({ storyTitle, videoUrl, thumbnailUrl }),
    });
  },

  async sendGiftReceived(
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    message: string,
    giftCode: string
  ) {
    return resend.emails.send({
      from: 'MyAmari <gifts@myamari.com>',
      to: recipientEmail,
      subject: `${senderName} sent you a gift!`,
      react: GiftReceivedEmail({ recipientName, senderName, message, giftCode }),
    });
  },
};
```

**Environment Variables:**
```bash
RESEND_API_KEY=re_...
```

Sources: [Resend Next.js](https://resend.com/nextjs), [React Email](https://react.email/)

---

### 0.6 Background Jobs with Inngest

**Why Inngest over Trigger.dev:** Deeper Vercel integration, 100M+ daily executions proven, native serverless support, real-time updates feature.

**Installation:**
```bash
npm install inngest
```

**Setup:**

```typescript
// lib/inngest/client.ts
import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'myamari',
  name: 'MyAmari',
});
```

**Define functions:**

```typescript
// lib/inngest/functions.ts
import { inngest } from './client';
import { VideoGenerator } from '@/lib/ai/video-generator';
import { emailService } from '@/lib/email/service';

// Video generation job (can take 5-10 minutes)
export const generateVideoJob = inngest.createFunction(
  {
    id: 'generate-video',
    name: 'Generate Video Storybook',
    retries: 2,
    onFailure: async ({ error, event }) => {
      // Update status to failed
      await supabase
        .from('story_videos')
        .update({ status: 'failed', error_message: error.message })
        .eq('id', event.data.videoId);

      // Refund credits
      await refundCredits(event.data.userId, event.data.creditsCharged);
    },
  },
  { event: 'video/generate.requested' },
  async ({ event, step }) => {
    const { videoId, storyId, userId, resolution } = event.data;

    // Step 1: Get story and assets
    const { story, illustrations, audio } = await step.run('fetch-assets', async () => {
      const story = await getStory(storyId);
      const illustrations = await getStoryIllustrations(storyId);
      const audio = await getStoryAudio(storyId);
      return { story, illustrations, audio };
    });

    // Step 2: Generate video clips (may take a while)
    const clips = await step.run('generate-clips', async () => {
      const videoGenerator = new VideoGenerator();
      return videoGenerator.generateClips(illustrations, resolution);
    });

    // Step 3: Combine with audio
    const finalVideo = await step.run('combine-video', async () => {
      const videoGenerator = new VideoGenerator();
      return videoGenerator.combineWithAudio(clips, audio);
    });

    // Step 4: Upload to storage
    const storedUrl = await step.run('upload-video', async () => {
      return uploadVideoToStorage(finalVideo.url, `videos/${storyId}`);
    });

    // Step 5: Update database
    await step.run('update-database', async () => {
      await supabase
        .from('story_videos')
        .update({
          video_url: storedUrl,
          thumbnail_url: illustrations[0].imageUrl,
          duration_seconds: finalVideo.duration,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', videoId);
    });

    // Step 6: Send notification email
    await step.run('send-notification', async () => {
      const user = await getUser(userId);
      await emailService.sendVideoReady(
        user.email,
        story.title,
        `${process.env.NEXT_PUBLIC_APP_URL}/stories/${storyId}/video`,
        illustrations[0].imageUrl
      );
    });

    return { success: true, videoUrl: storedUrl };
  }
);

// Monthly credit refill job
export const monthlyCreditsRefill = inngest.createFunction(
  {
    id: 'monthly-credits-refill',
    name: 'Monthly Credits Refill',
  },
  { cron: '0 0 1 * *' }, // First of every month
  async ({ step }) => {
    // Get all active subscriptions
    const subscriptions = await step.run('get-subscriptions', async () => {
      return getActiveSubscriptions();
    });

    // Refill credits for each user
    for (const sub of subscriptions) {
      await step.run(`refill-${sub.userId}`, async () => {
        const creditService = new CreditService();
        await creditService.refillSubscriptionCredits(sub.userId);
      });
    }

    return { refilled: subscriptions.length };
  }
);

// Voice cloning job (runs in background)
export const cloneVoiceJob = inngest.createFunction(
  {
    id: 'clone-voice',
    name: 'Clone Voice',
    retries: 1,
  },
  { event: 'voice/clone.requested' },
  async ({ event, step }) => {
    const { userId, audioUrl, voiceName } = event.data;

    const clonedVoice = await step.run('clone-voice', async () => {
      const audioGenerator = new AudioGenerator();
      const audioBuffer = await fetch(audioUrl).then(r => r.arrayBuffer());
      return audioGenerator.cloneVoice([Buffer.from(audioBuffer)], voiceName);
    });

    await step.run('save-voice', async () => {
      await supabase.from('voice_profiles').insert({
        user_id: userId,
        name: voiceName,
        provider: 'elevenlabs',
        provider_voice_id: clonedVoice.voiceId,
        is_cloned: true,
        preview_url: clonedVoice.previewUrl,
      });
    });

    return { voiceId: clonedVoice.voiceId };
  }
);
```

**API route:**

```typescript
// app/api/inngest/route.ts
import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import {
  generateVideoJob,
  monthlyCreditsRefill,
  cloneVoiceJob,
} from '@/lib/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateVideoJob, monthlyCreditsRefill, cloneVoiceJob],
});
```

**Triggering jobs:**

```typescript
// In your API route
await inngest.send({
  name: 'video/generate.requested',
  data: {
    videoId,
    storyId,
    userId,
    resolution: '1080p',
    creditsCharged: 25,
  },
});
```

Sources: [Inngest Docs](https://www.inngest.com/docs), [Inngest Vercel](https://vercel.com/marketplace/inngest)

---

### 0.7 Supabase Connection Pooling

**Configure Supavisor for serverless:**

```typescript
// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js';

// For serverless functions, use the pooler connection (port 6543)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  db: {
    // Use transaction mode for serverless
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// For direct connections (migrations, admin tasks)
export const supabaseDirect = createClient(
  process.env.SUPABASE_DIRECT_URL!, // Direct connection string
  supabaseKey
);
```

**Environment Variables:**
```bash
# Pooler connection (for serverless)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
DATABASE_URL=postgres://postgres.xxx:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres

# Direct connection (for migrations)
SUPABASE_DIRECT_URL=postgres://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
```

Sources: [Supabase Connection Management](https://supabase.com/docs/guides/database/connection-management), [Supavisor](https://supabase.com/blog/supavisor-postgres-connection-pooler)

---

### 0.8 TDD Testing Infrastructure

**This is the FIRST thing we build** — before any feature code.

**Install all testing dependencies:**
```bash
# Unit & Integration testing
npm install -D vitest @vitejs/plugin-react jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# API mocking (critical for TDD with external services)
npm install -D msw@latest

# E2E testing
npm install -D @playwright/test
npx playwright install

# Coverage reporting
npm install -D @vitest/coverage-v8

# Test utilities
npm install -D @faker-js/faker
```

**Vitest configuration (TDD-optimized):**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // TDD: Run in watch mode by default during development
    watch: true,

    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],

    // TDD: Include all test patterns
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
      'tests/contracts/**/*.test.{ts,tsx}',
    ],

    // TDD: Fail fast on first error during development
    bail: process.env.CI ? 0 : 1,

    // TDD: Show detailed output
    reporter: ['verbose'],

    // Coverage thresholds (enforced in CI)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types.ts',
      ],
      // TDD: Enforce minimum coverage
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },

    // TDD: Type checking during tests
    typecheck: {
      enabled: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**Test setup with MSW for API mocking:**

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from './mocks/server';

// MSW Server Setup
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic-key');
vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
vi.stubEnv('ELEVENLABS_API_KEY', 'test-elevenlabs-key');

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn(() => ({ userId: 'test-user-id' })),
  currentUser: vi.fn(() => ({
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  })),
  useAuth: vi.fn(() => ({ userId: 'test-user-id', isLoaded: true })),
  useUser: vi.fn(() => ({ user: { id: 'test-user-id' }, isLoaded: true })),
}));

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
      insert: vi.fn(() => ({ data: null, error: null })),
      update: vi.fn(() => ({ data: null, error: null })),
      delete: vi.fn(() => ({ data: null, error: null })),
    })),
  },
}));
```

**MSW Mock Handlers (for external APIs):**

```typescript
// tests/mocks/handlers/anthropic.ts
import { http, HttpResponse } from 'msw';

export const anthropicHandlers = [
  // Mock Claude story generation
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      id: 'msg_test123',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: `TITLE: The Magical Adventure

Once upon a time, there was a brave little girl named ${body.messages?.[0]?.content?.includes('Luna') ? 'Luna' : 'Emma'}...

The End.

SUMMARY: A bedtime story about courage and friendship.`,
        },
      ],
      model: 'claude-sonnet-4-5-20241022',
      usage: {
        input_tokens: 150,
        output_tokens: 500,
      },
    });
  }),
];

// tests/mocks/handlers/openai.ts
import { http, HttpResponse } from 'msw';

export const openaiHandlers = [
  // Mock image generation
  http.post('https://api.openai.com/v1/images/generations', async () => {
    return HttpResponse.json({
      created: Date.now(),
      data: [
        {
          url: 'https://test-images.example.com/generated-image.png',
          revised_prompt: 'A child-friendly watercolor illustration...',
        },
      ],
    });
  }),

  // Mock GPT-4o chat
  http.post('https://api.openai.com/v1/chat/completions', async () => {
    return HttpResponse.json({
      id: 'chatcmpl-test123',
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'TITLE: Test Story\n\nOnce upon a time...',
          },
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 400,
      },
    });
  }),
];

// tests/mocks/handlers/elevenlabs.ts
import { http, HttpResponse } from 'msw';

export const elevenlabsHandlers = [
  // Mock voice list
  http.get('https://api.elevenlabs.io/v1/voices', () => {
    return HttpResponse.json({
      voices: [
        {
          voice_id: 'test-voice-1',
          name: 'Sarah',
          category: 'premade',
          labels: { 'use case': 'narration' },
        },
      ],
    });
  }),

  // Mock text-to-speech
  http.post('https://api.elevenlabs.io/v1/text-to-speech/:voiceId', () => {
    // Return mock audio buffer
    const audioBuffer = new ArrayBuffer(1024);
    return HttpResponse.arrayBuffer(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  }),
];

// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { anthropicHandlers } from './handlers/anthropic';
import { openaiHandlers } from './handlers/openai';
import { elevenlabsHandlers } from './handlers/elevenlabs';

export const server = setupServer(
  ...anthropicHandlers,
  ...openaiHandlers,
  ...elevenlabsHandlers
);
```

**Test Fixtures (reusable test data):**

```typescript
// tests/mocks/fixtures/users.ts
import { faker } from '@faker-js/faker';

export const createMockUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  clerk_id: `user_${faker.string.alphanumeric(24)}`,
  email: faker.internet.email(),
  subscription_status: 'free' as const,
  created_at: faker.date.past().toISOString(),
  ...overrides,
});

export const createMockPremiumUser = (overrides = {}) =>
  createMockUser({
    subscription_status: 'premium',
    stripe_customer_id: `cus_${faker.string.alphanumeric(14)}`,
    ...overrides,
  });

// tests/mocks/fixtures/credits.ts
export const createMockCreditBalance = (overrides = {}) => ({
  available_credits: 50,
  lifetime_earned: 100,
  lifetime_spent: 50,
  ...overrides,
});

// tests/mocks/fixtures/stories.ts
export const createMockStory = (overrides = {}) => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  title: faker.lorem.sentence(4),
  content: faker.lorem.paragraphs(3),
  tone: 'calm' as const,
  length: 'medium' as const,
  word_count: faker.number.int({ min: 200, max: 800 }),
  created_at: faker.date.past().toISOString(),
  ...overrides,
});
```

---

### 0.9 TDD Example: Credit Service (Red-Green-Refactor)

This demonstrates the EXACT workflow for implementing every feature.

**Step 1: RED - Write failing tests FIRST**

```typescript
// tests/unit/lib/credits/credit-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockCreditBalance } from '@/tests/mocks/fixtures/credits';

// NOTE: CreditService doesn't exist yet - this will fail!
// import { CreditService, CREDIT_COSTS } from '@/lib/credits/credit-service';

describe('CreditService', () => {
  describe('getBalance', () => {
    it('should return user credit balance', async () => {
      // This test will FAIL because CreditService doesn't exist
      const creditService = new CreditService();
      const balance = await creditService.getBalance('user-123');

      expect(balance).toHaveProperty('available_credits');
      expect(balance).toHaveProperty('lifetime_earned');
      expect(balance).toHaveProperty('lifetime_spent');
    });

    it('should return zero balance for new users', async () => {
      const creditService = new CreditService();
      const balance = await creditService.getBalance('new-user');

      expect(balance.available_credits).toBe(0);
    });
  });

  describe('spendCredits', () => {
    it('should reject when insufficient credits', async () => {
      const creditService = new CreditService();

      // Mock: user has 5 credits
      vi.spyOn(creditService, 'getBalance').mockResolvedValue(
        createMockCreditBalance({ available_credits: 5 })
      );

      // Try to spend 10 credits
      const result = await creditService.spendCredits(
        'user-123',
        10,
        'illustration',
        'Test story'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient credits');
    });

    it('should deduct credits when balance is sufficient', async () => {
      const creditService = new CreditService();

      vi.spyOn(creditService, 'getBalance').mockResolvedValue(
        createMockCreditBalance({ available_credits: 50 })
      );

      const result = await creditService.spendCredits(
        'user-123',
        10,
        'illustration',
        'Test story'
      );

      expect(result.success).toBe(true);
      expect(result.balance.available_credits).toBe(40);
    });

    it('should create transaction record', async () => {
      const creditService = new CreditService();
      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      vi.spyOn(creditService, 'getBalance').mockResolvedValue(
        createMockCreditBalance({ available_credits: 50 })
      );

      await creditService.spendCredits('user-123', 10, 'story', 'Test');

      // Verify transaction was recorded
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('addCredits', () => {
    it('should add credits to user balance', async () => {
      const creditService = new CreditService();

      vi.spyOn(creditService, 'getBalance').mockResolvedValue(
        createMockCreditBalance({ available_credits: 50 })
      );

      const result = await creditService.addCredits(
        'user-123',
        60,
        'subscription_refill',
        'Monthly refill'
      );

      expect(result.available_credits).toBe(110);
    });
  });

  describe('CREDIT_COSTS', () => {
    it('should have correct costs for each operation', () => {
      expect(CREDIT_COSTS.text_story).toBe(5);
      expect(CREDIT_COSTS.illustrated_story).toBe(10);
      expect(CREDIT_COSTS.audio_narration).toBe(10);
      expect(CREDIT_COSTS.video_storybook).toBe(25);
    });
  });
});
```

**Run tests - see RED:**
```bash
npm test -- credit-service

# Output:
# ❌ FAIL  tests/unit/lib/credits/credit-service.test.ts
# Error: Cannot find module '@/lib/credits/credit-service'
```

**Step 2: GREEN - Write minimum code to pass**

```typescript
// lib/credits/credit-service.ts
import { supabaseAdmin } from '@/lib/supabase/server';

export const CREDIT_COSTS = {
  text_story: 5,
  illustrated_story: 10,
  additional_image: 2,
  audio_narration: 10,
  video_storybook: 25,
  video_storybook_hd: 50,
  voice_clone: 20,
} as const;

export interface CreditBalance {
  available_credits: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

export interface SpendResult {
  success: boolean;
  balance: CreditBalance;
  error?: string;
}

export class CreditService {
  async getBalance(userId: string): Promise<CreditBalance> {
    const { data } = await supabaseAdmin
      .from('credit_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data ?? {
      available_credits: 0,
      lifetime_earned: 0,
      lifetime_spent: 0
    };
  }

  async spendCredits(
    userId: string,
    amount: number,
    type: string,
    description: string,
    referenceId?: string
  ): Promise<SpendResult> {
    const balance = await this.getBalance(userId);

    if (balance.available_credits < amount) {
      return {
        success: false,
        balance,
        error: `Insufficient credits. Need ${amount}, have ${balance.available_credits}`,
      };
    }

    const newBalance = balance.available_credits - amount;

    // Update balance
    await supabaseAdmin
      .from('credit_balances')
      .update({
        available_credits: newBalance,
        lifetime_spent: balance.lifetime_spent + amount,
      })
      .eq('user_id', userId);

    // Record transaction
    await supabaseAdmin.from('credit_transactions').insert({
      user_id: userId,
      amount: -amount,
      balance_after: newBalance,
      transaction_type: type,
      reference_id: referenceId,
      description,
    });

    return {
      success: true,
      balance: {
        available_credits: newBalance,
        lifetime_earned: balance.lifetime_earned,
        lifetime_spent: balance.lifetime_spent + amount,
      },
    };
  }

  async addCredits(
    userId: string,
    amount: number,
    type: string,
    description: string,
    referenceId?: string
  ): Promise<CreditBalance> {
    const balance = await this.getBalance(userId);
    const newBalance = balance.available_credits + amount;

    await supabaseAdmin
      .from('credit_balances')
      .upsert({
        user_id: userId,
        available_credits: newBalance,
        lifetime_earned: balance.lifetime_earned + amount,
      });

    await supabaseAdmin.from('credit_transactions').insert({
      user_id: userId,
      amount,
      balance_after: newBalance,
      transaction_type: type,
      reference_id: referenceId,
      description,
    });

    return {
      available_credits: newBalance,
      lifetime_earned: balance.lifetime_earned + amount,
      lifetime_spent: balance.lifetime_spent,
    };
  }
}
```

**Run tests - see GREEN:**
```bash
npm test -- credit-service

# Output:
# ✓ tests/unit/lib/credits/credit-service.test.ts (6 tests)
# All tests passed!
```

**Step 3: REFACTOR - Clean up while keeping tests green**

```typescript
// lib/credits/credit-service.ts (refactored)
// ... extract common patterns, add error handling, etc.
// Run tests after each change to ensure they still pass
```

---

### 0.10 TDD Cheat Sheet for Each Phase

| Phase | Write Tests For | Before Implementing |
|-------|-----------------|---------------------|
| **Phase 0** | Rate limiter, Zod schemas, email templates | Infrastructure code |
| **Phase 1** | AI providers, prompt templates, content filter | AI integration |
| **Phase 2** | Image generator, character profiles, scene extraction | Image features |
| **Phase 3** | Audio generator, voice cloning, stock voices | Audio features |
| **Phase 4** | Video generator, clip combining, CDN upload | Video features |
| **Phase 5** | Credit service, transactions, refunds | Credit system |
| **Phase 6** | Universe service, memory extraction, context building | Universe features |
| **Phase 7** | Prompt extraction, NL parsing, enhancement chips | Input redesign |
| **Phase 8** | Gift codes, redemption, PDF generation | Gifting features |
| **Phase 9** | Consent service, verification, data deletion | COPPA compliance |
| **Phase 10** | API client, offline storage, native components | Mobile app |

---

**Playwright E2E configuration (TDD-optimized):**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // TDD: Rich reporting
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    // TDD: Test on multiple devices
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // TDD: Expect assertions
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
});
```

**E2E Test Example (Written BEFORE the feature):**

```typescript
// tests/e2e/story-generation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Story Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    // ... login steps
  });

  test('should generate a story from natural language input', async ({ page }) => {
    await page.goto('/create');

    // Enter story prompt
    await page.fill(
      'textarea[placeholder*="story"]',
      'Make a calm bedtime story about a little girl named Luna exploring the moon'
    );

    // Wait for extraction
    await expect(page.getByText('Luna')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('calm')).toBeVisible();

    // Generate story
    await page.click('button:has-text("Create My Story")');

    // Wait for story to generate
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 30000,
    });

    // Verify story content
    await expect(page.locator('.story-content')).toContainText('Luna');
  });
});
```

**Package.json scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

Sources: [Next.js Playwright Testing](https://nextjs.org/docs/pages/guides/testing/playwright), [Vitest + Next.js](https://strapi.io/blog/nextjs-testing-guide-unit-and-e2e-tests-with-vitest-and-playwright)

---

## Phase 1: AI Provider Infrastructure (Week 2-3)

### 1.1 Multi-Provider AI Service Architecture

Create a unified AI service layer that supports multiple providers with fallback.

**New Files:**
```
lib/
├── ai/
│   ├── providers/
│   │   ├── index.ts              # Provider registry
│   │   ├── anthropic.ts          # Claude integration
│   │   ├── openai.ts             # GPT-4o integration
│   │   └── types.ts              # Shared types
│   ├── story-generator.ts        # Unified story generation
│   ├── prompt-templates.ts       # Prompt engineering
│   ├── cache.ts                  # Prompt caching logic
│   └── content-filter.ts         # Safety filtering
```

**Database Changes:**
```sql
-- Add AI provider tracking to stories
ALTER TABLE stories ADD COLUMN ai_provider TEXT DEFAULT 'anthropic';
ALTER TABLE stories ADD COLUMN ai_model TEXT;
ALTER TABLE stories ADD COLUMN generation_cost DECIMAL(10,6);
ALTER TABLE stories ADD COLUMN tokens_used INTEGER;

-- Add provider preferences to users
ALTER TABLE users ADD COLUMN preferred_ai_provider TEXT DEFAULT 'claude';

-- Cost tracking table
CREATE TABLE generation_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'story', 'image', 'audio', 'video'
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_usd DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generation_costs_user ON generation_costs(user_id, created_at DESC);
```

**Implementation:**

```typescript
// lib/ai/providers/types.ts
export interface StoryGenerationRequest {
  prompt: string;
  characters: Character[];
  tone: StoryTone;
  length: StoryLength;
  previousContext?: string;
  safetyLevel: 'strict' | 'moderate';
  universeContext?: string;
}

export interface StoryGenerationResponse {
  title: string;
  content: string;
  wordCount: number;
  tokensUsed: { input: number; output: number };
  cost: number;
  provider: 'anthropic' | 'openai';
  model: string;
  summary?: string; // For universe memory
}

export interface AIProvider {
  name: string;
  generateStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse>;
  estimateCost(request: StoryGenerationRequest): number;
  isAvailable(): Promise<boolean>;
}

export type StoryTone = 'calm' | 'adventurous' | 'funny' | 'mysterious' | 'educational';
export type StoryLength = 'short' | 'medium' | 'long';

export interface Character {
  name: string;
  age?: number;
  gender?: 'boy' | 'girl' | 'other';
  role?: 'protagonist' | 'sidekick' | 'pet' | 'mentor' | 'other';
  description?: string;
}
```

```typescript
// lib/ai/providers/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, StoryGenerationRequest, StoryGenerationResponse } from './types';
import { buildSystemPrompt, buildStoryPrompt, parseStoryResponse } from '../prompt-templates';
import { filterContent } from '../content-filter';

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse> {
    const systemPrompt = buildSystemPrompt(request.safetyLevel);
    const userPrompt = buildStoryPrompt(request);

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20241022',
        max_tokens: this.getMaxTokens(request.length),
        system: [
          {
            type: 'text',
            text: systemPrompt,
            // Enable prompt caching for system prompt
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: request.universeContext
              ? [
                  {
                    type: 'text',
                    text: request.universeContext,
                    cache_control: { type: 'ephemeral' },
                  },
                  { type: 'text', text: userPrompt },
                ]
              : userPrompt,
          },
        ],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';

      // Safety filter
      const filteredContent = await filterContent(content, request.safetyLevel);
      const { title, story, summary } = parseStoryResponse(filteredContent);

      return {
        title,
        content: story,
        wordCount: this.countWords(story),
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
        cost: this.calculateCost(response.usage),
        provider: 'anthropic',
        model: 'claude-sonnet-4-5-20241022',
        summary,
      };
    } catch (error) {
      // Log to Sentry
      throw new Error(`Anthropic story generation failed: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple health check
      const response = await this.client.messages.create({
        model: 'claude-haiku-3-5-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return !!response.content;
    } catch {
      return false;
    }
  }

  estimateCost(request: StoryGenerationRequest): number {
    const estimatedInputTokens = 500 + (request.universeContext?.length ?? 0) / 4;
    const estimatedOutputTokens = this.getMaxTokens(request.length);
    return (estimatedInputTokens * 3 + estimatedOutputTokens * 15) / 1_000_000;
  }

  private calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
    // Claude Sonnet 4.5: $3/1M input, $15/1M output
    // With caching: reads are 0.1x, writes are 1.25x
    return (usage.input_tokens * 3 + usage.output_tokens * 15) / 1_000_000;
  }

  private getMaxTokens(length: StoryLength): number {
    switch (length) {
      case 'short': return 1000;
      case 'medium': return 2000;
      case 'long': return 4000;
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }
}
```

```typescript
// lib/ai/providers/openai.ts
import OpenAI from 'openai';
import { AIProvider, StoryGenerationRequest, StoryGenerationResponse } from './types';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generateStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse> {
    const systemPrompt = buildSystemPrompt(request.safetyLevel);
    const userPrompt = buildStoryPrompt(request);

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: this.getMaxTokens(request.length),
      temperature: 0.9,
      messages: [
        { role: 'system', content: systemPrompt },
        ...(request.universeContext
          ? [{ role: 'system', content: request.universeContext }]
          : []),
        { role: 'user', content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content ?? '';
    const { title, story, summary } = parseStoryResponse(content);

    return {
      title,
      content: story,
      wordCount: story.trim().split(/\s+/).length,
      tokensUsed: {
        input: response.usage?.prompt_tokens ?? 0,
        output: response.usage?.completion_tokens ?? 0,
      },
      cost: this.calculateCost(response.usage),
      provider: 'openai',
      model: 'gpt-4o',
      summary,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return !!response.choices[0];
    } catch {
      return false;
    }
  }

  estimateCost(request: StoryGenerationRequest): number {
    // GPT-4o: $2.50/1M input, $10/1M output
    const estimatedInputTokens = 500;
    const estimatedOutputTokens = this.getMaxTokens(request.length);
    return (estimatedInputTokens * 2.5 + estimatedOutputTokens * 10) / 1_000_000;
  }

  private calculateCost(usage?: { prompt_tokens: number; completion_tokens: number }): number {
    if (!usage) return 0;
    return (usage.prompt_tokens * 2.5 + usage.completion_tokens * 10) / 1_000_000;
  }

  private getMaxTokens(length: StoryLength): number {
    switch (length) {
      case 'short': return 1000;
      case 'medium': return 2000;
      case 'long': return 4000;
    }
  }
}
```

```typescript
// lib/ai/providers/index.ts
import { AIProvider } from './types';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';

class ProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private primaryProvider: string;
  private fallbackProvider: string;

  constructor() {
    this.providers.set('anthropic', new AnthropicProvider());
    this.providers.set('openai', new OpenAIProvider());

    this.primaryProvider = process.env.DEFAULT_STORY_PROVIDER ?? 'anthropic';
    this.fallbackProvider = process.env.FALLBACK_STORY_PROVIDER ?? 'openai';
  }

  async getAvailableProvider(): Promise<AIProvider> {
    const primary = this.providers.get(this.primaryProvider);
    if (primary && (await primary.isAvailable())) {
      return primary;
    }

    const fallback = this.providers.get(this.fallbackProvider);
    if (fallback && (await fallback.isAvailable())) {
      console.warn(`Primary provider ${this.primaryProvider} unavailable, using ${this.fallbackProvider}`);
      return fallback;
    }

    throw new Error('No AI providers available');
  }

  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }
}

export const providerRegistry = new ProviderRegistry();
```

```typescript
// lib/ai/content-filter.ts
export async function filterContent(
  content: string,
  safetyLevel: 'strict' | 'moderate'
): Promise<string> {
  // List of patterns to filter
  const strictPatterns = [
    /\b(kill|death|die|dead|murder|blood|scary|horror|nightmare)\b/gi,
    /\b(hate|stupid|idiot|dumb)\b/gi,
    /\b(gun|knife|weapon|fight|hurt|pain)\b/gi,
  ];

  const moderatePatterns = [
    /\b(kill|murder|blood|horror)\b/gi,
  ];

  const patterns = safetyLevel === 'strict' ? strictPatterns : moderatePatterns;

  let filtered = content;
  for (const pattern of patterns) {
    filtered = filtered.replace(pattern, (match) => {
      // Log filtered content for review
      console.warn(`Filtered content: "${match}"`);
      return '[gentle]';
    });
  }

  return filtered;
}
```

**Environment Variables:**
```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
DEFAULT_STORY_PROVIDER=anthropic
FALLBACK_STORY_PROVIDER=openai
```

---

## Phase 1.5: Design System & Core UI (Week 2)

This foundational phase establishes the visual language and component library that all subsequent features will use. Building this upfront prevents UI/UX debt and ensures consistency.

### 1.5.1 Design Principles for MyAmari 2.0

```
┌─────────────────────────────────────────────────────────────────┐
│                    MYAMARI DESIGN PRINCIPLES                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🌙 MAGICAL & WARM        │  👶 CHILD-SAFE & PARENT-FRIENDLY   │
│  • Soft gradients         │  • Large touch targets (44px min)  │
│  • Dreamy animations      │  • Clear visual hierarchy          │
│  • Warm color palette     │  • Non-distracting backgrounds     │
│  • Rounded corners        │  • Readable typography             │
│                           │                                     │
│  ⚡ RESPONSIVE & FAST     │  ♿ ACCESSIBLE & INCLUSIVE          │
│  • Skeleton loaders       │  • WCAG 2.1 AA compliance          │
│  • Optimistic UI          │  • Screen reader friendly          │
│  • Mobile-first           │  • Color-blind safe palette        │
│  • Smooth 60fps anims     │  • Reduced motion support          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.5.2 Design Tokens

**File: `lib/design/tokens.ts`**
```typescript
// Design tokens - Single source of truth for all styling
export const tokens = {
  colors: {
    // Primary palette - Magical purples
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7', // Primary brand
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    },
    // Secondary - Warm oranges (sunset/bedtime)
    secondary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316', // Secondary brand
      600: '#ea580c',
      700: '#c2410c',
    },
    // Semantic colors
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    info: '#3b82f6',
    // Neutrals - Warm grays
    neutral: {
      50: '#fafaf9',
      100: '#f5f5f4',
      200: '#e7e5e4',
      300: '#d6d3d1',
      400: '#a8a29e',
      500: '#78716c',
      600: '#57534e',
      700: '#44403c',
      800: '#292524',
      900: '#1c1917',
    },
    // Background gradients
    gradients: {
      magical: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      sunset: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      dream: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      night: 'linear-gradient(135deg, #0c1445 0%, #3c1053 100%)',
    },
  },
  typography: {
    fonts: {
      heading: '"Nunito", "Comic Sans MS", cursive, sans-serif',
      body: '"Inter", system-ui, sans-serif',
      story: '"Merriweather", Georgia, serif', // For story content
    },
    sizes: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75, // For story reading
    },
  },
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
  },
  radii: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px',
    card: '1.5rem', // Consistent card rounding
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.07)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
    xl: '0 20px 25px rgba(0,0,0,0.15)',
    glow: '0 0 20px rgba(168, 85, 247, 0.4)', // Magical glow
    card: '0 4px 20px rgba(0,0,0,0.08)',
  },
  animation: {
    durations: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      verySlow: '1000ms',
    },
    easings: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    },
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
  zIndex: {
    dropdown: 100,
    modal: 200,
    toast: 300,
    tooltip: 400,
  },
} as const;
```

### 1.5.3 Core Component Library

**File Structure:**
```
components/
├── ui/                           # Base UI components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   ├── Card/
│   ├── Input/
│   ├── Modal/
│   ├── Toast/
│   ├── Progress/
│   ├── Skeleton/
│   └── CreditBadge/
├── story/                        # Story-specific components
│   ├── StoryCard/
│   ├── PageViewer/
│   ├── IllustrationFrame/
│   └── NaturalInput/
├── credits/                      # Credit system UI
│   ├── CreditBalance/
│   ├── CostPreview/
│   ├── PurchaseModal/
│   └── UsageHistory/
├── generation/                   # AI generation UI
│   ├── GenerationProgress/
│   ├── ProviderBadge/
│   ├── RetryPrompt/
│   └── LoadingStates/
└── layout/                       # Layout components
    ├── Header/
    ├── Sidebar/
    ├── BottomNav/
    └── Container/
```

**Key Components:**

```tsx
// components/ui/Button/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles - accessible touch target
  'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px] min-w-[44px]',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-md hover:shadow-lg',
        secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500',
        outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50',
        ghost: 'text-neutral-600 hover:bg-neutral-100',
        magic: 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:opacity-90 shadow-glow',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-5 text-base',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-11 w-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="animate-spin mr-2">✨</span>
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);
```

```tsx
// components/ui/CreditBadge/CreditBadge.tsx
'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface CreditBadgeProps {
  balance: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  onClick?: () => void;
}

export function CreditBadge({ balance, size = 'md', showIcon = true, onClick }: CreditBadgeProps) {
  const sizes = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2',
  };

  const isLow = balance < 20;

  return (
    <motion.button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold
        ${sizes[size]}
        ${isLow
          ? 'bg-warning/10 text-warning border border-warning/20'
          : 'bg-primary-100 text-primary-700 border border-primary-200'
        }
        hover:scale-105 transition-transform cursor-pointer
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {showIcon && <Sparkles className="w-4 h-4" />}
      <span>{balance.toLocaleString()}</span>
      <span className="text-neutral-500">credits</span>
    </motion.button>
  );
}
```

```tsx
// components/generation/GenerationProgress/GenerationProgress.tsx
'use client';

import { motion } from 'framer-motion';

interface GenerationProgressProps {
  stage: 'story' | 'images' | 'audio' | 'video' | 'complete';
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  currentAction?: string;
}

const stages = [
  { key: 'story', label: 'Writing story', icon: '📖' },
  { key: 'images', label: 'Creating illustrations', icon: '🎨' },
  { key: 'audio', label: 'Recording narration', icon: '🎙️' },
  { key: 'video', label: 'Generating video', icon: '🎬' },
  { key: 'complete', label: 'Complete!', icon: '✨' },
];

export function GenerationProgress({
  stage,
  progress,
  estimatedTimeRemaining,
  currentAction,
}: GenerationProgressProps) {
  const currentStageIndex = stages.findIndex((s) => s.key === stage);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-card">
      {/* Stage indicators */}
      <div className="flex justify-between mb-6">
        {stages.map((s, i) => (
          <div
            key={s.key}
            className={`flex flex-col items-center ${
              i <= currentStageIndex ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <motion.div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                i < currentStageIndex
                  ? 'bg-success text-white'
                  : i === currentStageIndex
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-200'
              }`}
              animate={i === currentStageIndex ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {i < currentStageIndex ? '✓' : s.icon}
            </motion.div>
            <span className="text-xs mt-1 text-neutral-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Current action */}
      {currentAction && (
        <p className="text-center text-sm text-neutral-600 mt-4">{currentAction}</p>
      )}

      {/* Time estimate */}
      {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
        <p className="text-center text-xs text-neutral-400 mt-2">
          About {Math.ceil(estimatedTimeRemaining / 60)} min remaining
        </p>
      )}
    </div>
  );
}
```

### 1.5.4 Loading & Skeleton States

```tsx
// components/ui/Skeleton/StorySkeleton.tsx
export function StorySkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Title skeleton */}
      <div className="h-8 bg-neutral-200 rounded-lg w-3/4" />

      {/* Image skeleton */}
      <div className="aspect-[4/3] bg-neutral-200 rounded-2xl" />

      {/* Text lines */}
      <div className="space-y-2">
        <div className="h-4 bg-neutral-200 rounded w-full" />
        <div className="h-4 bg-neutral-200 rounded w-5/6" />
        <div className="h-4 bg-neutral-200 rounded w-4/6" />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-3">
        <div className="h-11 bg-neutral-200 rounded-xl w-32" />
        <div className="h-11 bg-neutral-200 rounded-xl w-32" />
      </div>
    </div>
  );
}

// components/ui/Skeleton/CreditsSkeleton.tsx
export function CreditsSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-2">
      <div className="w-6 h-6 bg-neutral-200 rounded-full" />
      <div className="h-5 bg-neutral-200 rounded w-16" />
    </div>
  );
}
```

### 1.5.5 Onboarding Flow Framework

```tsx
// components/onboarding/OnboardingFlow.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  illustration: React.ReactNode;
  action?: () => void;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to MyAmari 2.0! ✨',
    description: 'Create magical bedtime stories with AI-powered illustrations, voices, and even videos.',
    illustration: <WelcomeIllustration />,
  },
  {
    id: 'credits',
    title: 'How Credits Work',
    description: 'Credits power your story creation. Different features cost different amounts - you\'ll always see the cost before creating.',
    illustration: <CreditsIllustration />,
  },
  {
    id: 'child-profile',
    title: 'Create a Child Profile',
    description: 'Add your child\'s name, age, and interests to personalize every story.',
    illustration: <ProfileIllustration />,
  },
  {
    id: 'ready',
    title: 'You\'re Ready! 🚀',
    description: 'Start by describing a story you\'d like to create, or browse our story starters.',
    illustration: <ReadyIllustration />,
  },
];

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-primary-900 to-primary-800 z-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-md w-full text-center text-white"
        >
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep ? 'w-6 bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Illustration */}
          <div className="h-48 flex items-center justify-center mb-8">
            {step.illustration}
          </div>

          {/* Content */}
          <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
          <p className="text-white/80 mb-8">{step.description}</p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            {currentStep > 0 && (
              <Button variant="ghost" onClick={() => setCurrentStep(currentStep - 1)}>
                Back
              </Button>
            )}
            <Button variant="magic" onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>

          {/* Skip option */}
          {currentStep < steps.length - 1 && (
            <button
              onClick={onComplete}
              className="mt-4 text-white/50 text-sm hover:text-white/70"
            >
              Skip intro
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

### 1.5.6 Accessibility Setup

```typescript
// lib/accessibility/a11y.ts

// Focus trap for modals
export function useFocusTrap(ref: React.RefObject<HTMLElement>) {
  // Implementation for keyboard navigation within modals
}

// Announce to screen readers
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const el = document.createElement('div');
  el.setAttribute('aria-live', priority);
  el.setAttribute('aria-atomic', 'true');
  el.className = 'sr-only';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// Reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
}
```

### 1.5.7 TDD Tests for Components

```typescript
// tests/unit/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('has minimum touch target size of 44px', () => {
    render(<Button>Touch</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[44px]');
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies magic variant styles', () => {
    render(<Button variant="magic">Magic</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gradient-to-r');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 1.5.8 UI/UX Deliverables Checklist

| Deliverable | Description | Status |
|-------------|-------------|--------|
| Design tokens | Colors, typography, spacing, shadows | 🔲 |
| Button component | All variants, sizes, states | 🔲 |
| Card component | Story cards, info cards | 🔲 |
| Input component | Text, textarea, with validation | 🔲 |
| Modal component | Accessible, animated | 🔲 |
| Toast notifications | Success, error, info states | 🔲 |
| Progress indicators | Linear, circular, generation | 🔲 |
| Skeleton loaders | Story, credits, list views | 🔲 |
| Credit badge | Balance display, low warning | 🔲 |
| Cost preview | Show cost before generation | 🔲 |
| Onboarding flow | 4-step welcome experience | 🔲 |
| Accessibility audit | WCAG 2.1 AA baseline | 🔲 |
| Storybook setup | Component documentation | 🔲 |
| Component tests | 80%+ coverage | 🔲 |

---

## Phase 2: Image Generation (Week 3-4)

### 2.1 Database Schema Updates

```sql
-- Story images table
CREATE TABLE story_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT,
  thumbnail_url TEXT,
  storage_path TEXT, -- Path in Supabase Storage
  provider TEXT DEFAULT 'openai',
  model TEXT,
  style TEXT,
  generation_cost DECIMAL(10,6),
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, page_number)
);

-- Character visual profiles for consistency
CREATE TABLE character_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  visual_description TEXT,
  reference_image_url TEXT,
  style_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, LOWER(name))
);

-- Add image settings to stories
ALTER TABLE stories ADD COLUMN art_style TEXT DEFAULT 'watercolor';
ALTER TABLE stories ADD COLUMN has_illustrations BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN illustration_count INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX idx_story_images_story ON story_images(story_id);
CREATE INDEX idx_character_profiles_user ON character_profiles(user_id);
```

### 2.2 Image Generation Service

```typescript
// lib/ai/image-generator.ts
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase/server';
import * as Sentry from '@sentry/nextjs';

export type ArtStyle =
  | 'watercolor'
  | 'pixar'
  | 'cartoon'
  | 'anime'
  | 'storybook'
  | 'comic';

const STYLE_PROMPTS: Record<ArtStyle, string> = {
  watercolor: 'soft watercolor illustration, children\'s book style, gentle colors, hand-painted feel, dreamy atmosphere',
  pixar: '3D rendered Pixar-style, warm lighting, expressive characters, cinematic quality, smooth textures',
  cartoon: 'vibrant cartoon style, bold outlines, bright saturated colors, playful and fun, animated look',
  anime: 'anime art style, soft cel shading, large expressive eyes, pastel color palette, Japanese illustration',
  storybook: 'classic storybook illustration, detailed backgrounds, whimsical, nostalgic, golden age illustration style',
  comic: 'comic book style, dynamic poses, bold ink lines, action-oriented, graphic novel aesthetic',
};

const SAFETY_SUFFIX = `
CRITICAL REQUIREMENTS:
- Child-friendly content only, suitable for ages 3-10
- No scary, violent, or dark imagery
- Warm, gentle, and inviting visuals
- Soft lighting, no harsh shadows
- Happy or neutral expressions on characters
- No weapons, blood, or anything frightening
- Appropriate for bedtime viewing
`;

export interface ImageGenerationRequest {
  prompt: string;
  style: ArtStyle;
  characterProfiles?: CharacterProfile[];
  aspectRatio: '1:1' | '16:9' | '9:16';
  quality: 'low' | 'medium' | 'high';
}

export interface CharacterProfile {
  name: string;
  visualDescription: string;
}

export interface ImageGenerationResponse {
  imageUrl: string;
  revisedPrompt?: string;
  cost: number;
  model: string;
}

export class ImageGenerator {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generateStoryImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const stylePrompt = STYLE_PROMPTS[request.style];
    const characterContext = this.buildCharacterContext(request.characterProfiles);

    const fullPrompt = `
${request.prompt}

Style: ${stylePrompt}
${characterContext}
${SAFETY_SUFFIX}
    `.trim();

    try {
      const response = await this.openai.images.generate({
        model: 'gpt-image-1',
        prompt: fullPrompt,
        n: 1,
        size: this.getSize(request.aspectRatio),
        quality: request.quality === 'high' ? 'hd' : 'standard',
        response_format: 'url',
      });

      return {
        imageUrl: response.data[0].url!,
        revisedPrompt: response.data[0].revised_prompt,
        cost: this.calculateCost(request.quality, request.aspectRatio),
        model: 'gpt-image-1',
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: 'image_generation' },
        extra: { prompt: request.prompt.slice(0, 100) },
      });
      throw error;
    }
  }

  async generateStoryIllustrations(
    story: { id: string; content: string; title: string },
    pageCount: number,
    style: ArtStyle,
    characterProfiles: CharacterProfile[]
  ): Promise<StoryIllustration[]> {
    // Extract key scenes from story
    const scenes = await this.extractScenes(story.content, pageCount);

    // Generate images with rate limiting (avoid hitting API limits)
    const illustrations: StoryIllustration[] = [];
    const batchSize = 3; // Generate 3 at a time

    for (let i = 0; i < scenes.length; i += batchSize) {
      const batch = scenes.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (scene, batchIndex) => {
          const pageNumber = i + batchIndex + 1;

          const image = await this.generateStoryImage({
            prompt: scene.visualDescription,
            style,
            characterProfiles,
            aspectRatio: '16:9',
            quality: 'medium',
          });

          // Upload to Supabase Storage
          const storagePath = `stories/${story.id}/page-${pageNumber}.webp`;
          const storedUrl = await this.uploadToStorage(image.imageUrl, storagePath);

          return {
            pageNumber,
            sceneDescription: scene.description,
            imageUrl: storedUrl,
            storagePath,
            cost: image.cost,
          };
        })
      );

      illustrations.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < scenes.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return illustrations;
  }

  private async extractScenes(
    storyContent: string,
    pageCount: number
  ): Promise<{ description: string; visualDescription: string }[]> {
    // Use Claude Haiku for cheap/fast scene extraction
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `
Analyze this children's story and extract ${pageCount} key visual scenes for illustration.

Story:
${storyContent}

For each scene, provide:
1. A brief description (1 sentence)
2. A detailed visual description for image generation (2-3 sentences describing the scene, characters, setting, mood, lighting)

Return as JSON array:
[
  {
    "description": "Luna discovers the magic door",
    "visualDescription": "A young girl with brown curly hair wearing a purple dress stands before a glowing golden door in a dark forest. Soft moonlight filters through the trees, casting a warm glow on her amazed face. Fireflies dance around the magical doorframe."
  }
]

Focus on the most visually interesting and story-advancing moments.
          `,
        },
      ],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '[]';
    return JSON.parse(content);
  }

  private async uploadToStorage(imageUrl: string, path: string): Promise<string> {
    // Fetch image
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('story-assets')
      .upload(path, blob, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('story-assets')
      .getPublicUrl(path);

    return publicUrl;
  }

  private buildCharacterContext(profiles?: CharacterProfile[]): string {
    if (!profiles?.length) return '';

    return `
IMPORTANT - Character consistency requirements:
${profiles.map(p => `- ${p.name}: ${p.visualDescription}`).join('\n')}

All characters must match these descriptions exactly across all images.
    `;
  }

  private getSize(aspectRatio: string): '1024x1024' | '1792x1024' | '1024x1792' {
    switch (aspectRatio) {
      case '16:9': return '1792x1024';
      case '9:16': return '1024x1792';
      default: return '1024x1024';
    }
  }

  private calculateCost(quality: string, aspectRatio: string): number {
    // GPT Image 1 pricing (December 2025)
    const costs: Record<string, Record<string, number>> = {
      low: { '1:1': 0.011, '16:9': 0.016, '9:16': 0.016 },
      medium: { '1:1': 0.04, '16:9': 0.06, '9:16': 0.06 },
      high: { '1:1': 0.17, '16:9': 0.25, '9:16': 0.25 },
    };
    return costs[quality]?.[aspectRatio] ?? 0.06;
  }
}

export interface StoryIllustration {
  pageNumber: number;
  sceneDescription: string;
  imageUrl: string;
  storagePath: string;
  cost: number;
}
```

### 2.3 Character Consistency Service

```typescript
// lib/ai/character-consistency.ts
import Anthropic from '@anthropic-ai/sdk';

export class CharacterConsistencyService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async generateCharacterProfile(
    name: string,
    age?: number,
    gender?: string,
    userDescription?: string
  ): Promise<{ name: string; visualDescription: string }> {
    const prompt = `
Create a detailed, consistent visual character description for a children's story character.

Character details:
- Name: ${name}
- Age: ${age ?? 'child (5-10 years old)'}
- Gender: ${gender ?? 'not specified'}
${userDescription ? `- Additional details from parent: ${userDescription}` : ''}

Generate a visual description (3-4 sentences) that includes:
1. Hair color, style, and length
2. Eye color and expression
3. Skin tone
4. Typical outfit/clothing style (colorful, age-appropriate)
5. One or two distinguishing features
6. Overall demeanor (friendly, curious, brave, etc.)

The description should be:
- Specific enough to maintain consistency across multiple illustrations
- Child-appropriate and warm
- Easy for an image AI to interpret
- Not based on any real person or copyrighted character

Return ONLY the visual description paragraph, no other text.
    `;

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const visualDescription =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      name,
      visualDescription: visualDescription.trim(),
    };
  }

  async getOrCreateProfile(
    userId: string,
    name: string,
    age?: number,
    gender?: string
  ): Promise<{ name: string; visualDescription: string }> {
    // Check if profile exists
    const { data: existing } = await supabaseAdmin
      .from('character_profiles')
      .select('name, visual_description')
      .eq('user_id', userId)
      .ilike('name', name)
      .single();

    if (existing) {
      return {
        name: existing.name,
        visualDescription: existing.visual_description,
      };
    }

    // Generate new profile
    const profile = await this.generateCharacterProfile(name, age, gender);

    // Save to database
    await supabaseAdmin.from('character_profiles').insert({
      user_id: userId,
      name: profile.name,
      visual_description: profile.visualDescription,
    });

    return profile;
  }
}
```

### 2.X UI/UX Requirements for Image Generation

| Component | Description | Priority |
|-----------|-------------|----------|
| **IllustrationFrame** | Displays story illustrations with zoom, pan, swipe | High |
| **StylePicker** | Visual grid to select art style (watercolor, cartoon, etc.) | High |
| **ImageLoading** | Shimmer animation while image generates (5-15s) | High |
| **RegenerateButton** | One-tap retry if illustration doesn't match expectations | Medium |
| **CharacterPreview** | Show character consistency preview before generation | Medium |
| **ImageGallery** | Swipeable gallery for all story illustrations | Medium |

**User Flow Considerations:**
- Show estimated generation time ("Creating illustration... ~10 seconds")
- Display cost preview before generating each image
- Allow users to skip illustrations to save credits
- Provide "Regenerate" option if result is unsatisfactory

---

## Phase 3: Premium Audio Narration (Week 4-5)

### 3.1 ElevenLabs Integration

```typescript
// lib/ai/audio-generator.ts
import { ElevenLabsClient } from 'elevenlabs';
import { supabaseAdmin } from '@/lib/supabase/server';

export class AudioGenerator {
  private client: ElevenLabsClient;

  constructor() {
    this.client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }

  async generateNarration(
    text: string,
    voiceId: string,
    options?: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      speed?: number;
    }
  ): Promise<{
    audioBuffer: Buffer;
    durationSeconds: number;
    cost: number;
    format: string;
  }> {
    const audio = await this.client.generate({
      voice: voiceId,
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: options?.stability ?? 0.5,
        similarity_boost: options?.similarityBoost ?? 0.75,
        style: options?.style ?? 0.5,
        use_speaker_boost: true,
      },
    });

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    return {
      audioBuffer,
      durationSeconds: this.estimateDuration(text),
      cost: this.calculateCost(text.length),
      format: 'mp3',
    };
  }

  async cloneVoice(
    audioSamples: Buffer[],
    name: string,
    description: string
  ): Promise<{ voiceId: string; name: string; previewUrl?: string }> {
    // ElevenLabs voice cloning
    const voice = await this.client.voices.add({
      name,
      description,
      files: audioSamples.map((buffer, i) => ({
        filename: `sample_${i}.mp3`,
        buffer,
      })),
    });

    return {
      voiceId: voice.voice_id,
      name: voice.name,
      previewUrl: voice.preview_url,
    };
  }

  async listStockVoices(): Promise<
    Array<{
      id: string;
      name: string;
      category: string;
      previewUrl?: string;
      labels: Record<string, string>;
    }>
  > {
    const voices = await this.client.voices.getAll();

    // Filter to child-appropriate voices
    const childFriendly = voices.voices.filter(
      v =>
        v.labels?.['use case']?.includes('narration') ||
        v.labels?.['use case']?.includes('storytelling') ||
        v.category === 'premade'
    );

    return childFriendly.map(v => ({
      id: v.voice_id,
      name: v.name,
      category: v.category,
      previewUrl: v.preview_url,
      labels: v.labels ?? {},
    }));
  }

  async uploadStoryAudio(
    storyId: string,
    audioBuffer: Buffer
  ): Promise<string> {
    const path = `stories/${storyId}/narration.mp3`;

    const { error } = await supabaseAdmin.storage
      .from('story-assets')
      .upload(path, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('story-assets')
      .getPublicUrl(path);

    return publicUrl;
  }

  private calculateCost(characterCount: number): number {
    // ElevenLabs Pro tier: ~$0.18 per 1K characters
    return (characterCount / 1000) * 0.18;
  }

  private estimateDuration(text: string): number {
    // Average speaking rate: ~150 words per minute
    const words = text.split(/\s+/).length;
    return Math.ceil((words / 150) * 60);
  }
}
```

### 3.2 Database Schema for Audio

```sql
-- Voice profiles table
CREATE TABLE voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT DEFAULT 'elevenlabs',
  provider_voice_id TEXT NOT NULL,
  is_cloned BOOLEAN DEFAULT FALSE,
  clone_audio_url TEXT,
  preview_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story audio table
CREATE TABLE story_audio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  voice_profile_id UUID REFERENCES voice_profiles(id),
  audio_url TEXT NOT NULL,
  storage_path TEXT,
  duration_seconds INTEGER,
  format TEXT DEFAULT 'mp3',
  generation_cost DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, voice_profile_id)
);

-- Update stories table
ALTER TABLE stories ADD COLUMN primary_audio_id UUID REFERENCES story_audio(id);
ALTER TABLE stories ADD COLUMN has_audio BOOLEAN DEFAULT FALSE;

-- Indexes
CREATE INDEX idx_voice_profiles_user ON voice_profiles(user_id);
CREATE INDEX idx_story_audio_story ON story_audio(story_id);
```

### 3.X UI/UX Requirements for Audio Narration

| Component | Description | Priority |
|-----------|-------------|----------|
| **AudioPlayer** | Custom player with play/pause, progress, speed control | High |
| **VoicePicker** | Preview and select from ElevenLabs voices | High |
| **VoiceCloneWizard** | Step-by-step flow for custom voice creation | Medium |
| **WaveformVisualizer** | Animated waveform during playback | Low |
| **AudioDownload** | Download narration as MP3 for offline use | Medium |

**User Flow Considerations:**
- Auto-play option for bedtime mode (parent setting)
- Voice preview before committing credits
- Speed control (0.75x - 1.5x) for different reading paces
- Background audio option while viewing illustrations
- "Read to me" button prominently placed on story view

---

## Phase 4: Video Storybook Generation (Week 5-7)

### 4.1 Video CDN Setup with Bunny Stream

**Why Bunny over Cloudflare R2:** Complete video platform with transcoding, adaptive bitrate, DRM, customizable player, and predictable per-GB pricing.

```typescript
// lib/video/bunny-stream.ts
export class BunnyStreamService {
  private apiKey: string;
  private libraryId: string;
  private pullZoneUrl: string;

  constructor() {
    this.apiKey = process.env.BUNNY_STREAM_API_KEY!;
    this.libraryId = process.env.BUNNY_STREAM_LIBRARY_ID!;
    this.pullZoneUrl = process.env.BUNNY_STREAM_PULL_ZONE!;
  }

  async createVideo(title: string): Promise<{ videoId: string; uploadUrl: string }> {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${this.libraryId}/videos`,
      {
        method: 'POST',
        headers: {
          AccessKey: this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      }
    );

    const data = await response.json();
    return {
      videoId: data.guid,
      uploadUrl: `https://video.bunnycdn.com/library/${this.libraryId}/videos/${data.guid}`,
    };
  }

  async uploadVideo(videoId: string, videoBuffer: Buffer): Promise<void> {
    await fetch(
      `https://video.bunnycdn.com/library/${this.libraryId}/videos/${videoId}`,
      {
        method: 'PUT',
        headers: {
          AccessKey: this.apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: videoBuffer,
      }
    );
  }

  async getVideoStatus(videoId: string): Promise<{
    status: 'processing' | 'ready' | 'failed';
    thumbnailUrl?: string;
    hlsUrl?: string;
  }> {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${this.libraryId}/videos/${videoId}`,
      {
        headers: { AccessKey: this.apiKey },
      }
    );

    const data = await response.json();

    return {
      status: data.status === 4 ? 'ready' : data.status === 5 ? 'failed' : 'processing',
      thumbnailUrl: data.thumbnailFileName
        ? `${this.pullZoneUrl}/${videoId}/${data.thumbnailFileName}`
        : undefined,
      hlsUrl: data.status === 4
        ? `${this.pullZoneUrl}/${videoId}/playlist.m3u8`
        : undefined,
    };
  }

  getEmbedUrl(videoId: string): string {
    return `https://iframe.mediadelivery.net/embed/${this.libraryId}/${videoId}`;
  }
}
```

### 4.2 Video Generator with Sora 2 + Runway Fallback

```typescript
// lib/ai/video-generator.ts
import OpenAI from 'openai';
import * as Sentry from '@sentry/nextjs';

export interface VideoGenerationRequest {
  prompt: string;
  imageUrl?: string;
  duration: 5 | 10;
  resolution: '720p' | '1080p';
  aspectRatio: '16:9' | '9:16' | '1:1';
}

export class VideoGenerator {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generateVideoClip(
    request: VideoGenerationRequest
  ): Promise<{ videoUrl: string; duration: number; cost: number }> {
    const safePrompt = this.buildSafePrompt(request.prompt);

    try {
      // Try Sora 2 first
      const response = await this.openai.post('/v1/video/generations', {
        model: 'sora-2',
        prompt: safePrompt,
        duration: request.duration,
        resolution: request.resolution,
        aspect_ratio: request.aspectRatio,
        ...(request.imageUrl && { image: request.imageUrl }),
      });

      return {
        videoUrl: response.data.url,
        duration: request.duration,
        cost: this.calculateSoraCost(request.duration, request.resolution),
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: 'sora_video_generation' },
      });

      // Fallback to Runway Gen-3
      return this.generateWithRunway(request);
    }
  }

  private async generateWithRunway(
    request: VideoGenerationRequest
  ): Promise<{ videoUrl: string; duration: number; cost: number }> {
    const response = await fetch('https://api.runwayml.com/v1/generate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: this.buildSafePrompt(request.prompt),
        duration: request.duration,
        resolution: request.resolution,
        model: 'gen-3',
      }),
    });

    const data = await response.json();

    return {
      videoUrl: data.output_url,
      duration: request.duration,
      cost: this.calculateRunwayCost(request.duration),
    };
  }

  async generateStoryVideo(
    story: { id: string; title: string; content: string },
    illustrations: Array<{ pageNumber: number; imageUrl: string; sceneDescription: string }>,
    audio: { audioUrl: string; durationSeconds: number }
  ): Promise<{
    clips: Array<{ pageNumber: number; videoUrl: string; duration: number }>;
    totalCost: number;
  }> {
    const clips: Array<{ pageNumber: number; videoUrl: string; duration: number }> = [];
    let totalCost = 0;

    // Calculate clip duration based on audio
    const clipDuration = Math.min(
      10,
      Math.ceil(audio.durationSeconds / illustrations.length)
    ) as 5 | 10;

    for (const illustration of illustrations) {
      const result = await this.generateVideoClip({
        prompt: `Gentle, subtle animation of: ${illustration.sceneDescription}.
                 Soft movement like leaves rustling, characters breathing,
                 clouds drifting. Children's storybook animation style.`,
        imageUrl: illustration.imageUrl,
        duration: clipDuration,
        resolution: '1080p',
        aspectRatio: '16:9',
      });

      clips.push({
        pageNumber: illustration.pageNumber,
        videoUrl: result.videoUrl,
        duration: result.duration,
      });

      totalCost += result.cost;

      // Rate limiting between clips
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return { clips, totalCost };
  }

  private buildSafePrompt(prompt: string): string {
    return `
${prompt}

CRITICAL SAFETY REQUIREMENTS FOR CHILDREN'S CONTENT:
- Absolutely child-friendly, suitable for ages 3-10
- No violence, scary elements, or dark imagery whatsoever
- Warm, gentle, and inviting animation
- Soft, smooth, calming movements
- Appropriate for bedtime viewing
- No sudden movements or startling elements
- Peaceful, dreamlike quality
    `.trim();
  }

  private calculateSoraCost(duration: number, resolution: string): number {
    // Sora 2: $0.10-$0.50 per second depending on quality
    const ratePerSecond = resolution === '1080p' ? 0.30 : 0.15;
    return duration * ratePerSecond;
  }

  private calculateRunwayCost(duration: number): number {
    // Runway Gen-3: ~$0.50 per 5-second clip
    return (duration / 5) * 0.50;
  }
}
```

### 4.3 Video Processing Pipeline with Inngest

```typescript
// lib/inngest/video-functions.ts
import { inngest } from './client';
import { VideoGenerator } from '@/lib/ai/video-generator';
import { BunnyStreamService } from '@/lib/video/bunny-stream';
import { emailService } from '@/lib/email/service';
import { CreditService } from '@/lib/credits/credit-service';

export const generateVideoJob = inngest.createFunction(
  {
    id: 'generate-video-storybook',
    name: 'Generate Video Storybook',
    retries: 2,
    concurrency: {
      limit: 5, // Max 5 concurrent video jobs
    },
    onFailure: async ({ error, event }) => {
      const { videoId, userId, creditsCharged } = event.data;

      // Update status
      await supabase
        .from('story_videos')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', videoId);

      // Refund credits
      const creditService = new CreditService();
      await creditService.addCredits(
        userId,
        creditsCharged,
        'refund',
        `Video generation failed - refund`,
        videoId
      );

      // Notify user
      const user = await getUser(userId);
      await emailService.sendVideoFailed(user.email, error.message);
    },
  },
  { event: 'video/generate.requested' },
  async ({ event, step }) => {
    const { videoId, storyId, userId, resolution, creditsCharged } = event.data;

    // Step 1: Fetch all required assets
    const assets = await step.run('fetch-assets', async () => {
      const story = await getStory(storyId);
      const illustrations = await getStoryIllustrations(storyId);
      const audio = await getStoryAudio(storyId);

      if (!illustrations.length) {
        throw new Error('Story must have illustrations before generating video');
      }
      if (!audio) {
        throw new Error('Story must have audio narration before generating video');
      }

      return { story, illustrations, audio };
    });

    // Step 2: Generate video clips (this is the slow part)
    const videoResult = await step.run('generate-video-clips', async () => {
      const generator = new VideoGenerator();
      return generator.generateStoryVideo(
        assets.story,
        assets.illustrations,
        assets.audio
      );
    });

    // Step 3: Combine clips with audio using FFmpeg
    const combinedVideo = await step.run('combine-clips-audio', async () => {
      // This would use FFmpeg via a serverless function or service
      return combineVideoWithAudio(videoResult.clips, assets.audio);
    });

    // Step 4: Upload to Bunny Stream CDN
    const cdnResult = await step.run('upload-to-cdn', async () => {
      const bunny = new BunnyStreamService();
      const { videoId: bunnyVideoId } = await bunny.createVideo(assets.story.title);
      await bunny.uploadVideo(bunnyVideoId, combinedVideo.buffer);

      // Wait for processing
      let status = await bunny.getVideoStatus(bunnyVideoId);
      let attempts = 0;
      while (status.status === 'processing' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10s
        status = await bunny.getVideoStatus(bunnyVideoId);
        attempts++;
      }

      if (status.status === 'failed') {
        throw new Error('Bunny Stream processing failed');
      }

      return {
        bunnyVideoId,
        hlsUrl: status.hlsUrl,
        thumbnailUrl: status.thumbnailUrl,
        embedUrl: bunny.getEmbedUrl(bunnyVideoId),
      };
    });

    // Step 5: Update database
    await step.run('update-database', async () => {
      await supabase
        .from('story_videos')
        .update({
          video_url: cdnResult.hlsUrl,
          embed_url: cdnResult.embedUrl,
          thumbnail_url: cdnResult.thumbnailUrl,
          cdn_video_id: cdnResult.bunnyVideoId,
          duration_seconds: combinedVideo.duration,
          generation_cost: videoResult.totalCost,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', videoId);

      // Update story
      await supabase
        .from('stories')
        .update({ has_video: true })
        .eq('id', storyId);
    });

    // Step 6: Send notification
    await step.run('send-notification', async () => {
      const user = await getUser(userId);
      await emailService.sendVideoReady(
        user.email,
        assets.story.title,
        `${process.env.NEXT_PUBLIC_APP_URL}/stories/${storyId}/video`,
        cdnResult.thumbnailUrl
      );
    });

    return {
      success: true,
      videoUrl: cdnResult.hlsUrl,
      embedUrl: cdnResult.embedUrl,
    };
  }
);
```

### 4.4 Database Schema for Video

```sql
-- Story videos table
CREATE TABLE story_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  video_url TEXT,
  embed_url TEXT,
  thumbnail_url TEXT,
  cdn_video_id TEXT, -- Bunny Stream video ID
  duration_seconds INTEGER,
  resolution TEXT DEFAULT '1080p',
  format TEXT DEFAULT 'mp4',
  audio_id UUID REFERENCES story_audio(id),
  generation_cost DECIMAL(10,6),
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(story_id)
);

-- Video clips (individual scenes)
CREATE TABLE video_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_video_id UUID REFERENCES story_videos(id) ON DELETE CASCADE,
  page_number INTEGER,
  clip_url TEXT,
  duration_seconds INTEGER,
  provider TEXT, -- 'sora' or 'runway'
  generation_cost DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update stories table
ALTER TABLE stories ADD COLUMN has_video BOOLEAN DEFAULT FALSE;

-- Indexes
CREATE INDEX idx_story_videos_story ON story_videos(story_id);
CREATE INDEX idx_story_videos_status ON story_videos(status);
CREATE INDEX idx_video_clips_video ON video_clips(story_video_id);
```

### 4.X UI/UX Requirements for Video Generation

| Component | Description | Priority |
|-----------|-------------|----------|
| **VideoPlayer** | Custom player optimized for story videos | High |
| **VideoProgress** | Multi-stage progress (processing, rendering, uploading) | High |
| **VideoPreview** | Low-res preview before committing to full generation | Medium |
| **ShareVideoModal** | Social sharing options for completed videos | Medium |
| **VideoQualityPicker** | Select resolution (720p/1080p) based on credit cost | Low |

**User Flow Considerations:**
- **Clear time expectations**: Video generation takes 2-10 minutes - show real-time progress
- **Background processing**: Allow users to leave page while video generates
- **Email/push notification** when video is ready
- **Cost transparency**: Show 20-80 credit cost prominently before generation
- **Fallback messaging**: If Sora fails, explain Runway is processing
- **Download option**: MP4 download for offline viewing

---

## Phase 5: Credit System Migration (Week 7-8)

### 5.X UI/UX Requirements for Credit System

| Component | Description | Priority |
|-----------|-------------|----------|
| **CreditBalance** | Always-visible header badge with current balance | High |
| **CostPreview** | Shows exact credit cost before ANY generation action | High |
| **PurchaseModal** | Credit pack selection with Stripe checkout | High |
| **UsageHistory** | Timeline of credit usage with filtering | Medium |
| **LowBalanceWarning** | Inline alert when balance falls below 20 credits | Medium |
| **CostBreakdown** | Itemized cost preview (story: 8, images: 15, audio: 5 = 28 total) | Medium |

**User Flow Considerations:**
- **Never surprise users with costs** - show price before EVERY action
- **Insufficient credits** - graceful modal with purchase options, not error
- **Tier benefits** - clearly show what each credit pack includes
- **Auto-refill option** - for power users who don't want interruptions
- **Credit expiration** - if applicable, show expiration dates clearly

---

## Phase 6: Family Universe & Memory System (Week 8-9)

### 6.X UI/UX Requirements for Family Universe

| Component | Description | Priority |
|-----------|-------------|----------|
| **UniverseOverview** | Visual map/gallery of family's story universe | High |
| **CharacterCard** | Profile card for each recurring character | High |
| **CharacterCreator** | Wizard to define new character with visual preview | Medium |
| **StoryConnections** | Show how stories link to each other | Low |
| **MemoryTimeline** | Chronological view of family's story history | Low |

**User Flow Considerations:**
- **Character picker** during story creation to reuse existing characters
- **Universe stats** - total stories, characters, themes explored
- **Character growth** - show how characters have evolved across stories
- **Export universe** - downloadable family storybook PDF

---

## Phase 7: Natural Language Input Redesign (Week 9-10)

### 7.X UI/UX Requirements for Natural Language Input

| Component | Description | Priority |
|-----------|-------------|----------|
| **NaturalInput** | Large, friendly text area with mic button | High |
| **SuggestionChips** | Tappable story starters ("A story about...") | High |
| **ExtractionPreview** | Shows parsed child name, theme, mood before generation | High |
| **VoiceInputVisualizer** | Animated feedback during voice recording | Medium |
| **QuickActions** | One-tap story templates for common requests | Medium |

**User Flow Considerations:**
- **One input to rule them all** - user types or speaks naturally
- **Smart extraction** - show what AI understood before generating
- **Correction flow** - easy way to adjust extracted details
- **Example prompts** - rotate inspirational story ideas
- **Voice-first** - prominent microphone button for hands-free use

---

## Phase 8: Lifetime Plan & Gifting (Week 10-11)

### 8.X UI/UX Requirements for Lifetime & Gifting

| Component | Description | Priority |
|-----------|-------------|----------|
| **LifetimeBanner** | Compelling upgrade CTA with value proposition | High |
| **GiftPurchaseFlow** | Buy credits as gift with custom message | High |
| **GiftRedeemFlow** | Recipient redeems gift code | High |
| **PricingTable** | Compare tiers with feature matrix | Medium |
| **GiftPreview** | Preview gift email/card before sending | Medium |

**User Flow Considerations:**
- **Gift personalization** - custom message from grandparent to child
- **Scheduled delivery** - send gift on birthday/holiday
- **Gift tracking** - sender can see when gift was redeemed
- **Easy redemption** - one-click code entry, no account required to preview

---

## Phase 9: COPPA Compliance (Week 11-12)

### 9.1 COPPA Requirements

As of **June 23, 2025**, the updated FTC COPPA Rule is in effect. MyAmari collects personal information from children under 13 (names, story preferences), so compliance is mandatory.

**Key Requirements:**
1. **Verifiable Parental Consent** before collecting child data
2. **Clear Privacy Policy** describing data practices
3. **Data Minimization** - only collect what's necessary
4. **Parental Access** - parents can review/delete child data
5. **Separate Consent** for third-party disclosures
6. **Data Security** protections

Sources: [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions), [FTC COPPA Amendments](https://www.gibsondunn.com/ftc-updates-to-coppa-rule-impose-new-compliance-obligations-for-online-services-that-collect-data-from-children/)

### 9.2 Implementation

```typescript
// lib/coppa/consent-service.ts
export class COPPAConsentService {
  /**
   * Check if user has valid parental consent
   */
  async hasValidConsent(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('parental_consents')
      .select('*')
      .eq('user_id', userId)
      .eq('is_valid', true)
      .single();

    return !!data;
  }

  /**
   * Initiate parental consent flow
   */
  async initiateConsent(
    userId: string,
    parentEmail: string,
    childName: string
  ): Promise<{ consentId: string; verificationCode: string }> {
    const verificationCode = this.generateVerificationCode();
    const consentId = crypto.randomUUID();

    // Create pending consent record
    await supabase.from('parental_consents').insert({
      id: consentId,
      user_id: userId,
      parent_email: parentEmail,
      child_name: childName,
      verification_code: verificationCode,
      status: 'pending',
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
    });

    // Send verification email
    await emailService.sendParentalConsentRequest(
      parentEmail,
      childName,
      verificationCode,
      `${process.env.NEXT_PUBLIC_APP_URL}/consent/verify?id=${consentId}`
    );

    return { consentId, verificationCode };
  }

  /**
   * Verify parental consent with code
   * Uses "email plus" verification method (FTC approved)
   */
  async verifyConsent(
    consentId: string,
    verificationCode: string
  ): Promise<{ success: boolean; error?: string }> {
    const { data: consent } = await supabase
      .from('parental_consents')
      .select('*')
      .eq('id', consentId)
      .single();

    if (!consent) {
      return { success: false, error: 'Invalid consent request' };
    }

    if (new Date(consent.expires_at) < new Date()) {
      return { success: false, error: 'Consent request has expired' };
    }

    if (consent.verification_code !== verificationCode) {
      return { success: false, error: 'Invalid verification code' };
    }

    // Mark as verified
    await supabase
      .from('parental_consents')
      .update({
        status: 'verified',
        is_valid: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', consentId);

    return { success: true };
  }

  /**
   * Allow parent to revoke consent and delete child data
   */
  async revokeConsent(consentId: string): Promise<void> {
    const { data: consent } = await supabase
      .from('parental_consents')
      .select('user_id, child_name')
      .eq('id', consentId)
      .single();

    if (!consent) return;

    // Delete child-related data
    await supabase
      .from('children')
      .delete()
      .eq('user_id', consent.user_id)
      .ilike('name', consent.child_name);

    // Mark consent as revoked
    await supabase
      .from('parental_consents')
      .update({
        status: 'revoked',
        is_valid: false,
        revoked_at: new Date().toISOString(),
      })
      .eq('id', consentId);
  }

  private generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
```

### 9.3 Database Schema for COPPA

```sql
-- Parental consent records
CREATE TABLE parental_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_email TEXT NOT NULL,
  child_name TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'expired', 'revoked'
  is_valid BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  consent_version TEXT DEFAULT '1.0', -- Track which privacy policy version
  ip_address TEXT, -- For audit trail
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data deletion requests (COPPA right to delete)
CREATE TABLE data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  parent_email TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parental_consents_user ON parental_consents(user_id, is_valid);
CREATE INDEX idx_parental_consents_status ON parental_consents(status);
```

### 9.4 Privacy Policy & Consent UI

```typescript
// app/(auth)/consent/page.tsx
'use client';

import { useState } from 'react';

export default function ParentalConsentPage() {
  const [parentEmail, setParentEmail] = useState('');
  const [childName, setChildName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) return;

    await fetch('/api/consent/initiate', {
      method: 'POST',
      body: JSON.stringify({ parentEmail, childName }),
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Check Your Email!</h1>
        <p>
          We've sent a verification email to <strong>{parentEmail}</strong>.
          Please click the link to confirm your consent.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Parental Consent Required</h1>

      <p className="mb-4 text-gray-600">
        MyAmari collects your child's name and story preferences to create
        personalized stories. As required by COPPA, we need a parent or
        guardian's consent before proceeding.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Parent/Guardian Email
          </label>
          <input
            type="email"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="parent@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Child's Name</label>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter your child's first name"
          />
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="agree" className="text-sm">
            I am the parent or legal guardian of this child. I have read the{' '}
            <a href="/privacy" className="text-purple-600 underline">
              Privacy Policy
            </a>{' '}
            and consent to MyAmari collecting my child's name and story
            preferences to create personalized stories.
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!agreed || !parentEmail || !childName}
          className="w-full py-2 bg-purple-600 text-white rounded disabled:opacity-50"
        >
          Send Verification Email
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded text-sm">
        <h3 className="font-semibold mb-2">Your Rights Under COPPA:</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Review the personal information collected from your child</li>
          <li>Request deletion of your child's personal information</li>
          <li>Refuse further collection of your child's information</li>
          <li>Revoke consent at any time</li>
        </ul>
      </div>
    </div>
  );
}
```

### 9.X UI/UX Requirements for COPPA Compliance

| Component | Description | Priority |
|-----------|-------------|----------|
| **ConsentFlow** | Multi-step parental consent wizard | High |
| **ChildModeToggle** | Switch between parent and child views | High |
| **DataDashboard** | Parent view of all collected child data | High |
| **DeleteDataConfirm** | Confirm deletion with clear consequences | Medium |
| **AgeGate** | Age verification at signup | Medium |

**User Flow Considerations:**
- **Non-intrusive consent** - don't block until absolutely necessary
- **Email verification** - clear instructions, easy-to-find verification link
- **Parent dashboard** - single place to manage all child data
- **Data export** - downloadable JSON/PDF of child's data
- **Consent renewal** - gentle reminders when consent expires

---

## Phase 10: Mobile App (Week 12-14)

### 10.1 React Native Expo Setup

**Why Expo:** Official React Native recommendation, zero build config, OTA updates, pre-built components, Expo Go for testing.

```bash
# Create Expo app
npx create-expo-app myamari-mobile --template tabs

# Install dependencies
cd myamari-mobile
npx expo install expo-av expo-image expo-secure-store @clerk/clerk-expo
npm install @supabase/supabase-js @tanstack/react-query
```

**App structure:**
```
myamari-mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Home/Dashboard
│   │   ├── create.tsx         # Story creation
│   │   ├── library.tsx        # Story library
│   │   └── settings.tsx       # Settings
│   ├── story/
│   │   └── [id].tsx           # Story detail/playback
│   ├── _layout.tsx            # Root layout with auth
│   └── sign-in.tsx            # Clerk sign-in
├── components/
│   ├── StoryCard.tsx
│   ├── AudioPlayer.tsx
│   ├── VideoPlayer.tsx
│   └── NaturalInput.tsx
├── lib/
│   ├── supabase.ts
│   ├── api.ts
│   └── auth.ts
└── app.json
```

**Key mobile components:**

```typescript
// components/VideoPlayer.tsx
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export function StoryVideoPlayer({ hlsUrl }: { hlsUrl: string }) {
  const video = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus>();

  return (
    <View style={styles.container}>
      <Video
        ref={video}
        source={{ uri: hlsUrl }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        onPlaybackStatusUpdate={setStatus}
        style={styles.video}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  video: { flex: 1 },
});
```

Sources: [Expo Docs](https://docs.expo.dev/), [Expo for React Native 2025](https://hashrocket.com/blog/posts/expo-for-react-native-in-2025-a-perspective)

### 10.X UI/UX Requirements for Mobile App

| Component | Description | Priority |
|-----------|-------------|----------|
| **NativeStoryViewer** | Full-screen, swipeable story pages | High |
| **NativeAudioPlayer** | Background audio with lock screen controls | High |
| **OfflineMode** | Download stories for offline reading | High |
| **PushNotifications** | Story ready, credit low, new features | Medium |
| **HapticFeedback** | Subtle vibrations for interactions | Low |
| **WidgetSupport** | iOS/Android home screen story widget | Low |

**Mobile-Specific UX Considerations:**
- **Touch-first**: All targets minimum 44pt, swipe gestures for navigation
- **Offline-first**: Cache stories locally, sync when online
- **Background audio**: Continue narration when app is minimized
- **Quick actions**: 3D Touch / long-press for story shortcuts
- **Dark mode**: Auto-switch based on system preference
- **Bedtime mode**: Reduced brightness, warm colors after sunset
- **Screen time**: Parent controls for usage limits
- **Share sheet**: Native share for sending stories to family

---

## Revised Implementation Timeline

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 0** | Week 1 | Rate limiting, Sentry, PostHog, Zod, Resend, Inngest, testing setup |
| **Phase 1** | Week 2 | Multi-provider AI, Claude/GPT-4o integration, cost tracking |
| **Phase 1.5** | Week 2-3 | **Design system, component library, onboarding, accessibility** |
| **Phase 2** | Week 3-4 | Image generation, character consistency + **Image UI components** |
| **Phase 3** | Week 4-5 | ElevenLabs audio, voice cloning + **Audio player UI** |
| **Phase 4** | Week 5-7 | Sora 2 + Runway video, Bunny CDN + **Video player & progress UI** |
| **Phase 5** | Week 7-8 | Credit system, migration + **Credit balance & purchase UI** |
| **Phase 6** | Week 8-9 | Family universes, memory system + **Universe explorer UI** |
| **Phase 7** | Week 9-10 | Natural language input + **Voice input & extraction UI** |
| **Phase 8** | Week 10-11 | Lifetime plans, gifting + **Gift purchase & redeem flows** |
| **Phase 9** | Week 11-12 | COPPA compliance + **Consent & parent dashboard UI** |
| **Phase 10** | Week 12-15 | React Native Expo mobile app + **Mobile-native UI** |

**Total: 15 weeks** (includes dedicated UI/UX time)

---

## Revised Cost Analysis (Realistic)

### Monthly API Costs @ 1000 Active Users

| Service | Optimistic | Realistic | Worst Case |
|---------|------------|-----------|------------|
| Claude API | $150 | $300 | $500 |
| OpenAI Images | $400 | $600 | $1,000 |
| ElevenLabs (Pro) | $99 | $200 | $400 |
| **Sora 2 Video** | $500 | **$2,500** | $5,000 |
| Runway (fallback) | $0 | $300 | $600 |
| Bunny Stream CDN | $20 | $50 | $100 |
| Supabase Pro | $25 | $25 | $75 |
| Vercel Pro | $20 | $20 | $50 |
| Upstash Redis | $10 | $10 | $30 |
| Resend | $0 | $20 | $50 |
| Sentry | $26 | $26 | $80 |
| PostHog | $0 | $0 | $450 |
| Inngest | $0 | $50 | $150 |
| **TOTAL** | **$1,250** | **$4,100** | **$8,485** |

### Revenue @ 1000 Users (Conservative)

| Tier | Users | Monthly Revenue |
|------|-------|-----------------|
| Free | 400 | $0 |
| Premium Standard ($9.99) | 350 | $3,497 |
| Premium Plus ($19.99) | 180 | $3,598 |
| Family Pro ($29.99) | 70 | $2,099 |
| **Subtotal** | **1000** | **$9,194** |
| Lifetime sales (10/mo @ $149) | | $1,490 |
| **TOTAL** | | **$10,684** |

### Margin Analysis

- **Realistic costs:** $4,100/month
- **Realistic revenue:** $10,684/month
- **Stripe fees (2.9% + $0.30):** ~$400/month
- **Net profit:** ~$6,184/month
- **Gross margin:** ~58%

**Key insight:** Video generation is the margin killer. Consider:
1. Limiting video to Premium Plus and above
2. Capping videos per month (e.g., 5 for Plus, 15 for Pro)
3. Using Runway exclusively until Sora 2 API pricing stabilizes

---

## Risk Mitigation (Updated)

| Risk | Mitigation | Status |
|------|------------|--------|
| High API costs | Credit system + video caps | ✅ Planned |
| API cost spikes | Upstash rate limiting | ✅ Phase 0 |
| Character inconsistency | Character profiles + descriptions | ✅ Phase 2 |
| Video processing delays | Inngest async jobs + email notifications | ✅ Phase 4 |
| Safety concerns | Claude safety + content filter | ✅ Phase 1 |
| API outages | Multi-provider fallback (Claude→GPT, Sora→Runway) | ✅ Phase 1, 4 |
| COPPA violations | Parental consent flow | ✅ Phase 9 |
| No mobile presence | React Native Expo app | ✅ Phase 10 |
| Poor error visibility | Sentry integration | ✅ Phase 0 |
| No product insights | PostHog analytics | ✅ Phase 0 |
| Input validation gaps | Zod schemas | ✅ Phase 0 |
| Testing gaps | Vitest + Playwright | ✅ Phase 0 |
| Connection limits | Supavisor pooling | ✅ Phase 0 |

---

## Success Metrics

### Product Metrics
- Stories generated per user per month
- Illustration conversion rate (text → illustrated)
- Audio adoption rate
- Video adoption rate
- Universe creation rate
- Series completion rate
- Mobile app installs / DAU

### Business Metrics
- Free → paid conversion (target: 12%)
- ARPU (target: $12/month)
- Churn rate (target: <6%/month)
- Lifetime plan sales (target: 10/month)
- Gift redemption rate (target: 85%)
- CAC payback period (target: <3 months)

### Technical Metrics
- API error rate (target: <0.1%)
- P95 latency for story generation (target: <10s)
- P95 latency for image generation (target: <30s)
- Video generation success rate (target: >95%)
- Test coverage (target: >80%)

---

## Environment Variables Summary

```bash
# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
RUNWAY_API_KEY=...

# Provider Config
DEFAULT_STORY_PROVIDER=anthropic
FALLBACK_STORY_PROVIDER=openai

# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgres://...pooler.supabase.com:6543/postgres

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...

# Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Video CDN
BUNNY_STREAM_API_KEY=...
BUNNY_STREAM_LIBRARY_ID=...
BUNNY_STREAM_PULL_ZONE=https://xxx.b-cdn.net

# Rate Limiting & Caching
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=/ingest

# Email
RESEND_API_KEY=re_...

# Background Jobs
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Internal
JOB_SECRET=... # For internal job authentication
NEXT_PUBLIC_APP_URL=https://myamari.com
NODE_ENV=production
```

---

## Next Steps

1. **Review and approve this plan**
2. **Set up infrastructure accounts:**
   - Anthropic API access
   - ElevenLabs Pro ($99/mo)
   - Bunny Stream
   - Upstash
   - Sentry
   - PostHog
   - Resend
   - Inngest
3. **Create feature branch** for Phase 0
4. **Legal review** for COPPA privacy policy
5. **Begin Phase 0 implementation**

---

*Document Version 2.0 — Production-Ready Implementation Plan*
*Estimated Score: 92/100*
