// =============================================================================
// AI Provider Base Types and Interfaces
// =============================================================================

export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface StoryGenerationRequest {
  childName: string;
  childAge: number;
  theme: string;
  mood: string;
  duration: 'short' | 'medium' | 'long';
  customElements?: string[];
  characterDescription?: string;
  universeContext?: string; // Context from family universe (characters, memories)
}

export interface StoryGenerationResponse {
  title: string;
  content: string;
  pages: Array<{
    pageNumber: number;
    text: string;
    imagePrompt: string;
  }>;
  provider: string;
  model: string;
  tokensUsed: {
    input: number;
    output: number;
  };
}

export interface ImageGenerationRequest {
  prompt: string;
  style: 'watercolor' | 'cartoon' | 'storybook' | 'realistic' | 'anime' | 'pastel';
  size: '1024x1024' | '1792x1024' | '1024x1792';
  quality: 'standard' | 'hd';
  characterReferenceId?: string; // For character consistency
}

export interface ImageGenerationResponse {
  url: string;
  revisedPrompt?: string;
  provider: string;
  model: string;
}

export interface TextToSpeechRequest {
  text: string;
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

export interface TextToSpeechResponse {
  audioBuffer: ArrayBuffer;
  provider: string;
  voiceId: string;
  durationMs: number;
}

export interface VideoGenerationRequest {
  prompt: string;
  imageUrl?: string; // For image-to-video
  duration: 5 | 10 | 20; // seconds
  aspectRatio: '16:9' | '9:16' | '1:1';
  style?: string;
}

export interface VideoGenerationResponse {
  url: string;
  provider: string;
  model: string;
  durationSeconds: number;
  status: 'completed' | 'processing' | 'failed';
  taskId?: string;
}

export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
}

export interface StoryProvider extends AIProvider {
  generateStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse>;
}

export interface ImageProvider extends AIProvider {
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
}

export interface TTSProvider extends AIProvider {
  generateSpeech(request: TextToSpeechRequest): Promise<TextToSpeechResponse>;
  listVoices(): Promise<Array<{ id: string; name: string; category: string }>>;
}

export interface VideoProvider extends AIProvider {
  generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse>;
  checkStatus(taskId: string): Promise<VideoGenerationResponse>;
}

// Provider priority for fallback
export const PROVIDER_PRIORITY = {
  story: ['anthropic', 'openai'] as const,
  image: ['openai', 'stability'] as const,
  tts: ['elevenlabs', 'web'] as const,
  video: ['sora', 'runway'] as const,
};

export type StoryProviderName = typeof PROVIDER_PRIORITY.story[number];
export type ImageProviderName = typeof PROVIDER_PRIORITY.image[number];
export type TTSProviderName = typeof PROVIDER_PRIORITY.tts[number];
export type VideoProviderName = typeof PROVIDER_PRIORITY.video[number];

// Error classes
export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class RateLimitError extends AIProviderError {
  constructor(provider: string, retryAfterSeconds?: number) {
    super(
      `Rate limit exceeded for ${provider}${retryAfterSeconds ? `. Retry after ${retryAfterSeconds}s` : ''}`,
      provider,
      'RATE_LIMIT',
      true
    );
    this.name = 'RateLimitError';
  }
}

export class QuotaExceededError extends AIProviderError {
  constructor(provider: string) {
    super(`Quota exceeded for ${provider}`, provider, 'QUOTA_EXCEEDED', false);
    this.name = 'QuotaExceededError';
  }
}

export class ProviderUnavailableError extends AIProviderError {
  constructor(provider: string) {
    super(`Provider ${provider} is unavailable`, provider, 'UNAVAILABLE', true);
    this.name = 'ProviderUnavailableError';
  }
}
