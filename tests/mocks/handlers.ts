import { http, HttpResponse } from 'msw';

// =============================================================================
// MSW Mock Handlers for External APIs
// =============================================================================

export const handlers = [
  // -------------------------------------------------------------------------
  // OpenAI API Handlers
  // -------------------------------------------------------------------------
  http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
    const body = await request.json() as { model?: string; messages?: unknown[] };

    return HttpResponse.json({
      id: 'chatcmpl-test-123',
      object: 'chat.completion',
      created: Date.now(),
      model: body.model || 'gpt-4o',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'Once upon a time, in a magical forest, there lived a brave little bear named Teddy...',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 100,
        total_tokens: 150,
      },
    });
  }),

  http.post('https://api.openai.com/v1/images/generations', async ({ request }) => {
    const body = await request.json() as { n?: number };

    return HttpResponse.json({
      created: Date.now(),
      data: Array(body.n || 1).fill({
        url: 'https://example.com/test-image.png',
        revised_prompt: 'A beautiful illustration of a forest scene',
      }),
    });
  }),

  // -------------------------------------------------------------------------
  // Anthropic Claude API Handlers
  // -------------------------------------------------------------------------
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = await request.json() as { model?: string };

    return HttpResponse.json({
      id: 'msg_test_123',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'In a cozy little cottage at the edge of the enchanted woods, there lived a curious young fox...',
        },
      ],
      model: body.model || 'claude-sonnet-4-5-20250514',
      stop_reason: 'end_turn',
      usage: {
        input_tokens: 50,
        output_tokens: 100,
      },
    });
  }),

  // -------------------------------------------------------------------------
  // ElevenLabs TTS API Handlers
  // -------------------------------------------------------------------------
  http.post('https://api.elevenlabs.io/v1/text-to-speech/:voiceId', async () => {
    // Return mock audio buffer
    const audioBuffer = new ArrayBuffer(1024);
    return new HttpResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  }),

  http.get('https://api.elevenlabs.io/v1/voices', () => {
    return HttpResponse.json({
      voices: [
        {
          voice_id: 'voice_1',
          name: 'Storyteller Voice',
          category: 'professional',
        },
        {
          voice_id: 'voice_2',
          name: 'Child Voice',
          category: 'professional',
        },
      ],
    });
  }),

  // -------------------------------------------------------------------------
  // Sora 2 Video Generation API Handlers (OpenAI)
  // -------------------------------------------------------------------------
  http.post('https://api.openai.com/v1/videos/generations', async () => {
    return HttpResponse.json({
      id: 'video_test_123',
      status: 'processing',
      created_at: Date.now(),
    });
  }),

  http.get('https://api.openai.com/v1/videos/:videoId', ({ params }) => {
    return HttpResponse.json({
      id: params.videoId,
      status: 'completed',
      output_url: 'https://example.com/test-video.mp4',
      duration_seconds: 5,
    });
  }),

  // -------------------------------------------------------------------------
  // Runway Gen-3 API Handlers (Fallback)
  // -------------------------------------------------------------------------
  http.post('https://api.runwayml.com/v1/image-to-video', async () => {
    return HttpResponse.json({
      id: 'runway_task_123',
      status: 'PENDING',
    });
  }),

  http.get('https://api.runwayml.com/v1/tasks/:taskId', ({ params }) => {
    return HttpResponse.json({
      id: params.taskId,
      status: 'SUCCEEDED',
      output: ['https://example.com/runway-video.mp4'],
    });
  }),

  // -------------------------------------------------------------------------
  // Stripe API Handlers
  // -------------------------------------------------------------------------
  http.post('https://api.stripe.com/v1/customers', () => {
    return HttpResponse.json({
      id: 'cus_test_123',
      email: 'test@example.com',
      created: Date.now(),
    });
  }),

  http.post('https://api.stripe.com/v1/checkout/sessions', () => {
    return HttpResponse.json({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
      payment_status: 'unpaid',
    });
  }),

  http.get('https://api.stripe.com/v1/customers/:customerId', ({ params }) => {
    return HttpResponse.json({
      id: params.customerId,
      email: 'test@example.com',
      metadata: {},
    });
  }),

  // -------------------------------------------------------------------------
  // Upstash Redis Rate Limiting Handlers
  // -------------------------------------------------------------------------
  http.post('https://test.upstash.io/*', () => {
    return HttpResponse.json({
      result: 'OK',
    });
  }),

  http.get('https://test.upstash.io/*', () => {
    return HttpResponse.json({
      result: null,
    });
  }),

  // -------------------------------------------------------------------------
  // Supabase API Handlers
  // -------------------------------------------------------------------------
  http.get('https://test.supabase.co/rest/v1/*', () => {
    return HttpResponse.json([]);
  }),

  http.post('https://test.supabase.co/rest/v1/*', () => {
    return HttpResponse.json({ id: 'test-id' });
  }),

  http.patch('https://test.supabase.co/rest/v1/*', () => {
    return HttpResponse.json({ success: true });
  }),
];

// Error simulation handlers for testing error cases
export const errorHandlers = {
  openAIRateLimit: http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json(
      { error: { message: 'Rate limit exceeded', type: 'rate_limit_error' } },
      { status: 429 }
    );
  }),

  anthropicError: http.post('https://api.anthropic.com/v1/messages', () => {
    return HttpResponse.json(
      { error: { message: 'Internal server error', type: 'server_error' } },
      { status: 500 }
    );
  }),

  stripePaymentFailed: http.post('https://api.stripe.com/v1/checkout/sessions', () => {
    return HttpResponse.json(
      { error: { message: 'Payment failed', type: 'card_error' } },
      { status: 402 }
    );
  }),

  elevenlabsQuotaExceeded: http.post('https://api.elevenlabs.io/v1/text-to-speech/:voiceId', () => {
    return HttpResponse.json(
      { detail: { message: 'Quota exceeded' } },
      { status: 429 }
    );
  }),
};
