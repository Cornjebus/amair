import {
  StoryProvider,
  ImageProvider,
  TTSProvider,
  VideoProvider,
  StoryGenerationRequest,
  StoryGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  TextToSpeechRequest,
  TextToSpeechResponse,
  VideoGenerationRequest,
  VideoGenerationResponse,
  AIProviderError,
  ProviderUnavailableError,
  PROVIDER_PRIORITY,
} from './providers/base';
import { createAnthropicProvider } from './providers/anthropic';
import { createOpenAIStoryProvider, createOpenAIImageProvider } from './providers/openai';
import { createElevenLabsProvider, createWebSpeechProvider } from './providers/elevenlabs';
import { createSora2Provider, createRunwayProvider } from './providers/video';
import { captureError, trackAIUsage } from '@/lib/monitoring/sentry';
import { trackAICost } from '@/lib/monitoring/posthog';

// =============================================================================
// Unified AI Service with Multi-Provider Fallback
// =============================================================================

interface AIServiceConfig {
  preferredStoryProvider?: 'anthropic' | 'openai';
  preferredImageProvider?: 'openai';
  preferredTTSProvider?: 'elevenlabs' | 'web';
  preferredVideoProvider?: 'sora' | 'runway';
  enableFallback?: boolean;
  trackUsage?: boolean;
  userId?: string;
}

export class AIService {
  private storyProviders: Map<string, StoryProvider> = new Map();
  private imageProviders: Map<string, ImageProvider> = new Map();
  private ttsProviders: Map<string, TTSProvider> = new Map();
  private videoProviders: Map<string, VideoProvider> = new Map();
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig = {}) {
    this.config = {
      enableFallback: true,
      trackUsage: true,
      ...config,
    };

    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize story providers
    try {
      this.storyProviders.set('anthropic', createAnthropicProvider());
    } catch {
      console.warn('Anthropic provider not available');
    }

    try {
      this.storyProviders.set('openai', createOpenAIStoryProvider());
    } catch {
      console.warn('OpenAI story provider not available');
    }

    // Initialize image providers
    try {
      this.imageProviders.set('openai', createOpenAIImageProvider());
    } catch {
      console.warn('OpenAI image provider not available');
    }

    // Initialize TTS providers
    try {
      this.ttsProviders.set('elevenlabs', createElevenLabsProvider());
    } catch {
      console.warn('ElevenLabs provider not available');
    }
    this.ttsProviders.set('web', createWebSpeechProvider());

    // Initialize video providers
    try {
      this.videoProviders.set('sora', createSora2Provider());
    } catch {
      console.warn('Sora 2 provider not available');
    }

    try {
      this.videoProviders.set('runway', createRunwayProvider());
    } catch {
      console.warn('Runway provider not available');
    }
  }

  // -------------------------------------------------------------------------
  // Story Generation
  // -------------------------------------------------------------------------
  async generateStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse> {
    const providerOrder = this.getProviderOrder(
      'story',
      this.config.preferredStoryProvider
    );

    for (const providerName of providerOrder) {
      const provider = this.storyProviders.get(providerName);
      if (!provider) continue;

      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          console.warn(`Story provider ${providerName} is not available`);
          continue;
        }

        const result = await provider.generateStory(request);

        // Track usage
        if (this.config.trackUsage && this.config.userId) {
          this.trackUsage('story', providerName, result.tokensUsed);
        }

        return result;
      } catch (error) {
        console.error(`Story generation failed with ${providerName}:`, error);
        captureError(error as Error, {
          userId: this.config.userId,
          action: 'story_generation',
          metadata: { provider: providerName },
        });

        if (!this.config.enableFallback) {
          throw error;
        }
        // Continue to next provider
      }
    }

    throw new ProviderUnavailableError('story');
  }

  // -------------------------------------------------------------------------
  // Image Generation
  // -------------------------------------------------------------------------
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const providerOrder = this.getProviderOrder(
      'image',
      this.config.preferredImageProvider
    );

    for (const providerName of providerOrder) {
      const provider = this.imageProviders.get(providerName);
      if (!provider) continue;

      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) continue;

        const result = await provider.generateImage(request);

        if (this.config.trackUsage && this.config.userId) {
          this.trackUsage('image', providerName);
        }

        return result;
      } catch (error) {
        console.error(`Image generation failed with ${providerName}:`, error);
        captureError(error as Error, {
          userId: this.config.userId,
          action: 'image_generation',
          metadata: { provider: providerName },
        });

        if (!this.config.enableFallback) {
          throw error;
        }
      }
    }

    throw new ProviderUnavailableError('image');
  }

  // -------------------------------------------------------------------------
  // Text-to-Speech
  // -------------------------------------------------------------------------
  async generateSpeech(request: TextToSpeechRequest): Promise<TextToSpeechResponse> {
    const providerOrder = this.getProviderOrder('tts', this.config.preferredTTSProvider);

    for (const providerName of providerOrder) {
      const provider = this.ttsProviders.get(providerName);
      if (!provider) continue;

      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) continue;

        const result = await provider.generateSpeech(request);

        if (this.config.trackUsage && this.config.userId) {
          this.trackUsage('tts', providerName);
        }

        return result;
      } catch (error) {
        console.error(`TTS failed with ${providerName}:`, error);
        captureError(error as Error, {
          userId: this.config.userId,
          action: 'tts_generation',
          metadata: { provider: providerName },
        });

        if (!this.config.enableFallback) {
          throw error;
        }
      }
    }

    throw new ProviderUnavailableError('tts');
  }

  async listVoices(provider: 'elevenlabs' | 'web' = 'elevenlabs') {
    const ttsProvider = this.ttsProviders.get(provider);
    if (!ttsProvider) {
      throw new AIProviderError(`TTS provider ${provider} not available`, provider, 'NOT_AVAILABLE');
    }
    return ttsProvider.listVoices();
  }

  // -------------------------------------------------------------------------
  // Video Generation
  // -------------------------------------------------------------------------
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const providerOrder = this.getProviderOrder(
      'video',
      this.config.preferredVideoProvider
    );

    for (const providerName of providerOrder) {
      const provider = this.videoProviders.get(providerName);
      if (!provider) continue;

      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) continue;

        const result = await provider.generateVideo(request);

        if (this.config.trackUsage && this.config.userId) {
          this.trackUsage('video', providerName);
        }

        return result;
      } catch (error) {
        console.error(`Video generation failed with ${providerName}:`, error);
        captureError(error as Error, {
          userId: this.config.userId,
          action: 'video_generation',
          metadata: { provider: providerName },
        });

        if (!this.config.enableFallback) {
          throw error;
        }
      }
    }

    throw new ProviderUnavailableError('video');
  }

  async checkVideoStatus(taskId: string, provider: 'sora' | 'runway'): Promise<VideoGenerationResponse> {
    const videoProvider = this.videoProviders.get(provider);
    if (!videoProvider) {
      throw new AIProviderError(`Video provider ${provider} not available`, provider, 'NOT_AVAILABLE');
    }
    return videoProvider.checkStatus(taskId);
  }

  // -------------------------------------------------------------------------
  // Helper Methods
  // -------------------------------------------------------------------------
  private getProviderOrder(
    type: 'story' | 'image' | 'tts' | 'video',
    preferred?: string
  ): string[] {
    const defaultOrder = PROVIDER_PRIORITY[type] as readonly string[];
    if (!preferred) return [...defaultOrder];

    // Move preferred to front
    const order = [...defaultOrder];
    const idx = order.indexOf(preferred);
    if (idx > 0) {
      order.splice(idx, 1);
      order.unshift(preferred);
    }
    return order;
  }

  private trackUsage(
    type: string,
    provider: string,
    tokens?: { input: number; output: number }
  ) {
    // Estimate costs based on provider and type
    const costs: Record<string, Record<string, number>> = {
      story: { anthropic: 0.015, openai: 0.01 },
      image: { openai: 0.04 },
      tts: { elevenlabs: 0.03, web: 0 },
      video: { sora: 0.20, runway: 0.15 },
    };

    const estimatedCost = costs[type]?.[provider] || 0;

    trackAIUsage(provider as 'openai' | 'anthropic' | 'elevenlabs' | 'sora' | 'runway', type, tokens, estimatedCost);

    if (this.config.userId) {
      trackAICost(this.config.userId, provider, type, estimatedCost, tokens);
    }
  }

  // Get available providers for each type
  getAvailableProviders(): {
    story: string[];
    image: string[];
    tts: string[];
    video: string[];
  } {
    return {
      story: Array.from(this.storyProviders.keys()),
      image: Array.from(this.imageProviders.keys()),
      tts: Array.from(this.ttsProviders.keys()),
      video: Array.from(this.videoProviders.keys()),
    };
  }
}

// Singleton instance
let aiService: AIService | null = null;

export function getAIService(config?: AIServiceConfig): AIService {
  if (!aiService || config) {
    aiService = new AIService(config);
  }
  return aiService;
}

// Re-export types and errors
export * from './providers/base';
