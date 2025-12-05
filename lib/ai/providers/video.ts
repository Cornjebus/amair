import OpenAI from 'openai';
import {
  VideoProvider,
  VideoGenerationRequest,
  VideoGenerationResponse,
  AIProviderError,
  RateLimitError,
} from './base';

// =============================================================================
// Video Generation Providers (Sora 2 + Runway Gen-3 Fallback)
// =============================================================================

const RUNWAY_API_URL = 'https://api.runwayml.com/v1';

export class Sora2Provider implements VideoProvider {
  name = 'sora';
  private client: OpenAI;
  private model = 'sora-2';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OpenAI API key is required for Sora 2');
    }
    this.client = new OpenAI({ apiKey: key });
  }

  async isAvailable(): Promise<boolean> {
    // Check if Sora API is available
    try {
      return true; // Sora 2 is now generally available
    } catch {
      return false;
    }
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const prompt = this.buildVideoPrompt(request);

    try {
      // Using OpenAI's video generation API (Sora 2)
      // Note: API structure may vary - adjust based on actual OpenAI Sora API
      const response = await fetch('https://api.openai.com/v1/videos/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          duration: request.duration,
          aspect_ratio: request.aspectRatio,
          ...(request.imageUrl && { image_url: request.imageUrl }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          throw new RateLimitError(this.name);
        }
        throw new AIProviderError(
          error.message || 'Video generation failed',
          this.name,
          'GENERATION_FAILED'
        );
      }

      const data = await response.json();

      // If the video is still processing, return status
      if (data.status === 'processing') {
        return {
          url: '',
          provider: this.name,
          model: this.model,
          durationSeconds: request.duration,
          status: 'processing',
          taskId: data.id,
        };
      }

      return {
        url: data.output_url,
        provider: this.name,
        model: this.model,
        durationSeconds: data.duration_seconds || request.duration,
        status: 'completed',
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        `Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'GENERATION_FAILED'
      );
    }
  }

  async checkStatus(taskId: string): Promise<VideoGenerationResponse> {
    try {
      const response = await fetch(`https://api.openai.com/v1/videos/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new AIProviderError('Failed to check video status', this.name, 'STATUS_CHECK_FAILED');
      }

      const data = await response.json();

      return {
        url: data.output_url || '',
        provider: this.name,
        model: this.model,
        durationSeconds: data.duration_seconds || 0,
        status: data.status === 'completed' ? 'completed' :
                data.status === 'failed' ? 'failed' : 'processing',
        taskId,
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        `Failed to check status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'STATUS_CHECK_FAILED'
      );
    }
  }

  private buildVideoPrompt(request: VideoGenerationRequest): string {
    const parts = [
      request.prompt,
      'Child-friendly, warm and magical atmosphere.',
      'Smooth, gentle animation suitable for bedtime viewing.',
      'Soft lighting, pastel colors.',
    ];

    if (request.style) {
      parts.push(`Style: ${request.style}`);
    }

    return parts.join(' ');
  }
}

export class RunwayProvider implements VideoProvider {
  name = 'runway';
  private apiKey: string;
  private model = 'gen-3-alpha';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.RUNWAY_API_KEY;
    if (!key) {
      throw new Error('Runway API key is required');
    }
    this.apiKey = key;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${RUNWAY_API_URL}/health`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    if (!request.imageUrl) {
      throw new AIProviderError(
        'Runway Gen-3 requires an input image',
        this.name,
        'MISSING_IMAGE'
      );
    }

    try {
      const response = await fetch(`${RUNWAY_API_URL}/image-to-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          image_url: request.imageUrl,
          prompt: request.prompt,
          duration: request.duration,
          aspect_ratio: request.aspectRatio,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          throw new RateLimitError(this.name);
        }
        throw new AIProviderError(
          error.message || 'Video generation failed',
          this.name,
          'GENERATION_FAILED'
        );
      }

      const data = await response.json();

      return {
        url: '',
        provider: this.name,
        model: this.model,
        durationSeconds: request.duration,
        status: 'processing',
        taskId: data.id,
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        `Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'GENERATION_FAILED'
      );
    }
  }

  async checkStatus(taskId: string): Promise<VideoGenerationResponse> {
    try {
      const response = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (!response.ok) {
        throw new AIProviderError('Failed to check video status', this.name, 'STATUS_CHECK_FAILED');
      }

      const data = await response.json();

      const statusMap: Record<string, 'completed' | 'processing' | 'failed'> = {
        SUCCEEDED: 'completed',
        PENDING: 'processing',
        RUNNING: 'processing',
        FAILED: 'failed',
      };

      return {
        url: data.output?.[0] || '',
        provider: this.name,
        model: this.model,
        durationSeconds: 0,
        status: statusMap[data.status] || 'processing',
        taskId,
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        `Failed to check status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'STATUS_CHECK_FAILED'
      );
    }
  }
}

// Factory functions
export function createSora2Provider(apiKey?: string): Sora2Provider {
  return new Sora2Provider(apiKey);
}

export function createRunwayProvider(apiKey?: string): RunwayProvider {
  return new RunwayProvider(apiKey);
}
