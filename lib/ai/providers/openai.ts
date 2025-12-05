import OpenAI from 'openai';
import {
  StoryProvider,
  ImageProvider,
  StoryGenerationRequest,
  StoryGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  AIProviderError,
  RateLimitError,
} from './base';

// =============================================================================
// OpenAI Provider (GPT-4o + GPT Image 1)
// =============================================================================

const STORY_SYSTEM_PROMPT = `You are a master children's storyteller creating personalized bedtime stories.
Your stories are age-appropriate, engaging, and end on a positive note.
Include the child's name naturally and incorporate themes seamlessly.

Output format: Return ONLY a JSON object (no markdown, no code blocks) with:
{
  "title": "Story title",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Story text for this page (2-4 sentences)",
      "imagePrompt": "Detailed illustration prompt for this page"
    }
  ]
}

Pages by duration: short=4, medium=6, long=8`;

export class OpenAIStoryProvider implements StoryProvider {
  name = 'openai';
  private client: OpenAI;
  private model = 'gpt-4o';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OpenAI API key is required');
    }
    this.client = new OpenAI({ apiKey: key });
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      });
      return true;
    } catch {
      return false;
    }
  }

  async generateStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse> {
    const pageCount = request.duration === 'short' ? 4 : request.duration === 'medium' ? 6 : 8;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: STORY_SYSTEM_PROMPT },
          { role: 'user', content: this.buildUserPrompt(request, pageCount) },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AIProviderError('Empty response from OpenAI', this.name, 'EMPTY_RESPONSE');
      }

      const storyData = JSON.parse(content);

      return {
        title: storyData.title,
        content: storyData.pages.map((p: { text: string }) => p.text).join('\n\n'),
        pages: storyData.pages,
        provider: this.name,
        model: this.model,
        tokensUsed: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
        },
      };
    } catch (error) {
      if (error instanceof OpenAI.RateLimitError) {
        throw new RateLimitError(this.name);
      }
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        `Failed to generate story: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'GENERATION_FAILED'
      );
    }
  }

  private buildUserPrompt(request: StoryGenerationRequest, pageCount: number): string {
    const parts = [
      `Create a ${request.duration} bedtime story (${pageCount} pages) for ${request.childName}, age ${request.childAge}.`,
      `Theme: ${request.theme}`,
      `Mood: ${request.mood}`,
    ];

    if (request.customElements?.length) {
      parts.push(`Include these elements: ${request.customElements.join(', ')}`);
    }

    if (request.characterDescription) {
      parts.push(`Character description for illustrations: ${request.characterDescription}`);
    }

    return parts.join('\n');
  }
}

export class OpenAIImageProvider implements ImageProvider {
  name = 'openai';
  private client: OpenAI;
  private model = 'gpt-image-1'; // Latest image model

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OpenAI API key is required');
    }
    this.client = new OpenAI({ apiKey: key });
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple availability check
      return true;
    } catch {
      return false;
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const stylePrompt = this.getStylePrompt(request.style);
    const fullPrompt = `${stylePrompt} ${request.prompt}. Child-friendly, warm lighting, magical atmosphere.`;

    try {
      const response = await this.client.images.generate({
        model: this.model,
        prompt: fullPrompt,
        n: 1,
        size: request.size,
        quality: request.quality,
      });

      const imageData = response.data?.[0];
      if (!imageData?.url) {
        throw new AIProviderError('No image URL in response', this.name, 'EMPTY_RESPONSE');
      }

      return {
        url: imageData.url,
        revisedPrompt: imageData.revised_prompt,
        provider: this.name,
        model: this.model,
      };
    } catch (error) {
      if (error instanceof OpenAI.RateLimitError) {
        throw new RateLimitError(this.name);
      }
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'GENERATION_FAILED'
      );
    }
  }

  private getStylePrompt(style: string): string {
    const stylePrompts: Record<string, string> = {
      watercolor: 'Soft watercolor illustration style, gentle colors, flowing brushstrokes,',
      cartoon: 'Playful cartoon style, bright colors, expressive characters,',
      storybook: 'Classic storybook illustration, rich textures, detailed backgrounds,',
      realistic: 'Photorealistic digital art, detailed textures, natural lighting,',
      anime: 'Anime-inspired illustration, vibrant colors, expressive eyes,',
      pastel: 'Soft pastel colors, dreamy atmosphere, gentle gradients,',
    };
    return stylePrompts[style] || stylePrompts.storybook;
  }
}

// Factory functions
export function createOpenAIStoryProvider(apiKey?: string): OpenAIStoryProvider {
  return new OpenAIStoryProvider(apiKey);
}

export function createOpenAIImageProvider(apiKey?: string): OpenAIImageProvider {
  return new OpenAIImageProvider(apiKey);
}
