import {
  TTSProvider,
  TextToSpeechRequest,
  TextToSpeechResponse,
  AIProviderError,
  RateLimitError,
  QuotaExceededError,
} from './base';

// =============================================================================
// ElevenLabs Text-to-Speech Provider
// =============================================================================

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels?: Record<string, string>;
}

export class ElevenLabsProvider implements TTSProvider {
  name = 'elevenlabs';
  private apiKey: string;
  private defaultModel = 'eleven_multilingual_v2';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ELEVENLABS_API_KEY;
    if (!key) {
      throw new Error('ElevenLabs API key is required');
    }
    this.apiKey = key;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${ELEVENLABS_API_URL}/user`, {
        headers: { 'xi-api-key': this.apiKey },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateSpeech(request: TextToSpeechRequest): Promise<TextToSpeechResponse> {
    const url = `${ELEVENLABS_API_URL}/text-to-speech/${request.voiceId}`;

    try {
      const startTime = Date.now();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: request.text,
          model_id: request.modelId || this.defaultModel,
          voice_settings: {
            stability: request.stability ?? 0.5,
            similarity_boost: request.similarityBoost ?? 0.75,
          },
        }),
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const audioBuffer = await response.arrayBuffer();
      const durationMs = Date.now() - startTime;

      return {
        audioBuffer,
        provider: this.name,
        voiceId: request.voiceId,
        durationMs,
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        `Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'GENERATION_FAILED'
      );
    }
  }

  async listVoices(): Promise<Array<{ id: string; name: string; category: string }>> {
    try {
      const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
        headers: { 'xi-api-key': this.apiKey },
      });

      if (!response.ok) {
        throw new AIProviderError('Failed to fetch voices', this.name, 'FETCH_ERROR');
      }

      const data = await response.json();
      return data.voices.map((v: ElevenLabsVoice) => ({
        id: v.voice_id,
        name: v.name,
        category: v.category,
      }));
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        `Failed to list voices: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'FETCH_ERROR'
      );
    }
  }

  // Recommended voices for children's stories
  getRecommendedVoices(): Array<{ id: string; name: string; description: string }> {
    return [
      {
        id: 'EXAVITQu4vr4xnSDxMaL', // Sarah
        name: 'Sarah',
        description: 'Warm, nurturing female voice perfect for bedtime stories',
      },
      {
        id: 'TX3LPaxmHKxFdv7VOQHJ', // Liam
        name: 'Liam',
        description: 'Friendly male voice with gentle storytelling quality',
      },
      {
        id: 'XB0fDUnXU5powFXDhCwa', // Charlotte
        name: 'Charlotte',
        description: 'Soft, soothing voice ideal for calming stories',
      },
    ];
  }

  private async handleError(response: Response): Promise<never> {
    const status = response.status;
    let errorMessage = 'Unknown error';

    try {
      const errorData = await response.json();
      errorMessage = errorData.detail?.message || errorData.message || 'Unknown error';
    } catch {
      errorMessage = response.statusText;
    }

    if (status === 429) {
      throw new RateLimitError(this.name);
    }

    if (status === 401) {
      throw new AIProviderError('Invalid API key', this.name, 'AUTH_ERROR');
    }

    if (status === 422 && errorMessage.includes('quota')) {
      throw new QuotaExceededError(this.name);
    }

    throw new AIProviderError(errorMessage, this.name, 'API_ERROR');
  }
}

// Web Speech API fallback for free tier
export class WebSpeechProvider implements TTSProvider {
  name = 'web';

  async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  async generateSpeech(request: TextToSpeechRequest): Promise<TextToSpeechResponse> {
    // Web Speech API is handled client-side, return empty buffer
    // The actual speech is generated in the browser
    return {
      audioBuffer: new ArrayBuffer(0),
      provider: this.name,
      voiceId: request.voiceId,
      durationMs: 0,
    };
  }

  async listVoices(): Promise<Array<{ id: string; name: string; category: string }>> {
    if (typeof window === 'undefined') return [];

    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(
          voices.map((v) => ({
            id: v.voiceURI,
            name: v.name,
            category: v.localService ? 'local' : 'remote',
          }))
        );
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          const updatedVoices = window.speechSynthesis.getVoices();
          resolve(
            updatedVoices.map((v) => ({
              id: v.voiceURI,
              name: v.name,
              category: v.localService ? 'local' : 'remote',
            }))
          );
        };
      }
    });
  }
}

// Factory functions
export function createElevenLabsProvider(apiKey?: string): ElevenLabsProvider {
  return new ElevenLabsProvider(apiKey);
}

export function createWebSpeechProvider(): WebSpeechProvider {
  return new WebSpeechProvider();
}
