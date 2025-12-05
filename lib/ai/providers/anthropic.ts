import Anthropic from '@anthropic-ai/sdk';
import {
  StoryProvider,
  StoryGenerationRequest,
  StoryGenerationResponse,
  AIProviderError,
  RateLimitError,
} from './base';

// =============================================================================
// Anthropic Claude Provider
// =============================================================================

const STORY_SYSTEM_PROMPT = `You are a master children's storyteller creating personalized bedtime stories.
Your stories are:
- Age-appropriate and engaging
- Rich with vivid imagery perfect for illustration
- Warm, nurturing, and end on a positive note
- Include the child's name naturally in the narrative
- Incorporate requested themes and custom elements seamlessly

Output format: Return a JSON object with:
- title: Story title
- pages: Array of page objects, each with:
  - pageNumber: Sequential number
  - text: The story text for this page (2-4 sentences)
  - imagePrompt: A detailed prompt for illustrating this page

Create stories with this many pages based on duration:
- short: 4 pages
- medium: 6 pages
- long: 8 pages`;

export class AnthropicProvider implements StoryProvider {
  name = 'anthropic';
  private client: Anthropic;
  private model = 'claude-sonnet-4-5-20250514';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('Anthropic API key is required');
    }
    this.client = new Anthropic({ apiKey: key });
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple health check
      await this.client.messages.create({
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

    const userPrompt = this.buildUserPrompt(request, pageCount);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: STORY_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });

      // Extract text content
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new AIProviderError('No text content in response', this.name, 'EMPTY_RESPONSE');
      }

      // Parse JSON response
      const storyData = this.parseStoryResponse(textContent.text);

      return {
        title: storyData.title,
        content: storyData.pages.map((p: { text: string }) => p.text).join('\n\n'),
        pages: storyData.pages,
        provider: this.name,
        model: this.model,
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      };
    } catch (error) {
      if (error instanceof Anthropic.RateLimitError) {
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

    parts.push('\nRespond with valid JSON only.');

    return parts.join('\n');
  }

  private parseStoryResponse(text: string): { title: string; pages: Array<{ pageNumber: number; text: string; imagePrompt: string }> } {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AIProviderError('Could not parse story response as JSON', this.name, 'PARSE_ERROR');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      throw new AIProviderError('Invalid JSON in story response', this.name, 'PARSE_ERROR');
    }
  }
}

// Factory function
export function createAnthropicProvider(apiKey?: string): AnthropicProvider {
  return new AnthropicProvider(apiKey);
}
