/**
 * Story Generation Orchestrator
 *
 * Coordinates the full story generation pipeline:
 * 1. Validate user has enough credits
 * 2. Generate story text with AI
 * 3. Generate illustrations (optional)
 * 4. Generate audio narration (optional)
 * 5. Deduct credits and save to database
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { AIService, getAIService, StoryGenerationRequest, ImageGenerationRequest, TextToSpeechRequest } from '@/lib/ai';
import { CreditService, InsufficientCreditsError } from '@/lib/credits/credit-service';
import { CreditCosts } from '@/lib/validations/schemas';
import { captureError } from '@/lib/monitoring/sentry';

// Image style type from base provider
type ImageStyle = 'watercolor' | 'cartoon' | 'storybook' | 'realistic' | 'anime' | 'pastel';

// Helper to convert style string to valid ImageStyle
function toImageStyle(style?: string): ImageStyle {
  const validStyles: ImageStyle[] = ['watercolor', 'cartoon', 'storybook', 'realistic', 'anime', 'pastel'];
  if (style && validStyles.includes(style as ImageStyle)) {
    return style as ImageStyle;
  }
  return 'storybook';
}

// =============================================================================
// Types
// =============================================================================

export interface StoryGenerationOptions {
  // Child info
  childId: string;
  childName: string;
  childAge: number;

  // Story parameters
  theme: string;
  mood: string;
  duration: 'short' | 'medium' | 'long';
  customElements?: string[];
  characterDescription?: string;

  // Output options
  includeIllustrations: boolean;
  illustrationStyle?: string;
  illustrationQuality?: 'standard' | 'hd';

  includeNarration: boolean;
  voiceId?: string;
  voiceProvider?: 'elevenlabs' | 'web';
}

export interface GeneratedPage {
  pageNumber: number;
  text: string;
  imagePrompt?: string;
  imageUrl?: string;
}

export interface GeneratedStory {
  id: string;
  title: string;
  pages: GeneratedPage[];
  audioUrl?: string;
  audioDuration?: number;
  totalCreditsUsed: number;
  generationTime: number;
  providers: {
    story: string;
    image?: string;
    voice?: string;
  };
}

export interface GenerationProgress {
  stage: 'preparing' | 'story' | 'images' | 'audio' | 'saving' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  currentPage?: number;
  totalPages?: number;
}

type ProgressCallback = (progress: GenerationProgress) => void;

// =============================================================================
// Story Orchestrator
// =============================================================================

export class StoryOrchestrator {
  private aiService: AIService;
  private creditService: CreditService;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient, userId: string) {
    this.supabase = supabase;
    this.aiService = getAIService({ userId, trackUsage: true });
    this.creditService = new CreditService(supabase);
  }

  /**
   * Calculate the total credit cost for story generation
   */
  calculateCost(options: StoryGenerationOptions): {
    story: number;
    illustrations: number;
    narration: number;
    total: number;
    breakdown: { item: string; cost: number }[];
  } {
    const pageCount = options.duration === 'short' ? 4 : options.duration === 'medium' ? 6 : 8;
    const breakdown: { item: string; cost: number }[] = [];

    // Base story cost
    const storyCost = CreditCosts.story[options.duration];
    breakdown.push({ item: `Story (${options.duration})`, cost: storyCost });

    // Illustration costs
    let illustrationCost = 0;
    if (options.includeIllustrations) {
      const quality = options.illustrationQuality === 'hd' ? 'premium' : 'standard';
      const perPageCost = CreditCosts.illustration[quality];
      illustrationCost = pageCount * perPageCost;
      breakdown.push({
        item: `Illustrations (${pageCount} pages, ${quality})`,
        cost: illustrationCost,
      });
    }

    // Narration costs
    let narrationCost = 0;
    if (options.includeNarration) {
      const voiceQuality = options.voiceProvider === 'elevenlabs' ? 'premium' : 'basic';
      narrationCost = CreditCosts.narration[voiceQuality];
      breakdown.push({ item: `Narration (${voiceQuality})`, cost: narrationCost });
    }

    return {
      story: storyCost,
      illustrations: illustrationCost,
      narration: narrationCost,
      total: storyCost + illustrationCost + narrationCost,
      breakdown,
    };
  }

  /**
   * Generate a complete story with all assets
   */
  async generateStory(
    userId: string,
    options: StoryGenerationOptions,
    onProgress?: ProgressCallback
  ): Promise<GeneratedStory> {
    const startTime = Date.now();
    const cost = this.calculateCost(options);

    // Update progress helper
    const updateProgress = (progress: GenerationProgress) => {
      if (onProgress) {
        onProgress(progress);
      }
    };

    try {
      // Step 1: Check credits
      updateProgress({
        stage: 'preparing',
        progress: 5,
        message: 'Checking credit balance...',
      });

      const hasCredits = await this.creditService.hasEnoughCredits(userId, cost.total);
      if (!hasCredits) {
        const balance = await this.creditService.getBalance(userId);
        throw new InsufficientCreditsError(cost.total, balance);
      }

      // Step 2: Generate story text
      updateProgress({
        stage: 'story',
        progress: 10,
        message: 'Creating your magical story...',
      });

      const storyRequest: StoryGenerationRequest = {
        childName: options.childName,
        childAge: options.childAge,
        theme: options.theme,
        mood: options.mood,
        duration: options.duration,
        customElements: options.customElements,
        characterDescription: options.characterDescription,
      };

      const storyResult = await this.aiService.generateStory(storyRequest);
      const pages: GeneratedPage[] = storyResult.pages.map((p) => ({
        pageNumber: p.pageNumber,
        text: p.text,
        imagePrompt: p.imagePrompt,
      }));

      updateProgress({
        stage: 'story',
        progress: 30,
        message: 'Story created!',
      });

      // Step 3: Generate illustrations (if requested)
      let imageProvider: string | undefined;
      if (options.includeIllustrations) {
        const totalPages = pages.length;

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          updateProgress({
            stage: 'images',
            progress: 30 + Math.round((i / totalPages) * 40),
            message: `Creating illustration ${i + 1} of ${totalPages}...`,
            currentPage: i + 1,
            totalPages,
          });

          if (page.imagePrompt) {
            const imageRequest: ImageGenerationRequest = {
              prompt: page.imagePrompt,
              style: toImageStyle(options.illustrationStyle),
              size: '1024x1024',
              quality: options.illustrationQuality || 'standard',
            };

            const imageResult = await this.aiService.generateImage(imageRequest);
            page.imageUrl = imageResult.url;
            imageProvider = imageResult.provider;
          }
        }

        updateProgress({
          stage: 'images',
          progress: 70,
          message: 'All illustrations created!',
        });
      }

      // Step 4: Generate narration (if requested)
      let audioUrl: string | undefined;
      let audioDuration: number | undefined;
      let voiceProvider: string | undefined;

      if (options.includeNarration && options.voiceId) {
        updateProgress({
          stage: 'audio',
          progress: 75,
          message: 'Recording narration...',
        });

        const fullText = pages.map((p) => p.text).join('\n\n');
        const speechRequest: TextToSpeechRequest = {
          text: fullText,
          voiceId: options.voiceId,
          stability: 0.5,
          similarityBoost: 0.75,
        };
        const speechResult = await this.aiService.generateSpeech(speechRequest);

        // Convert audio buffer to base64 data URL for storage
        // In production, you'd upload to cloud storage and get a URL
        const base64Audio = Buffer.from(speechResult.audioBuffer).toString('base64');
        audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
        audioDuration = Math.round(speechResult.durationMs / 1000); // Convert to seconds
        voiceProvider = speechResult.provider;

        updateProgress({
          stage: 'audio',
          progress: 85,
          message: 'Narration recorded!',
        });
      }

      // Step 5: Deduct credits and save to database
      updateProgress({
        stage: 'saving',
        progress: 90,
        message: 'Saving your story...',
      });

      // Create story record
      const { data: story, error: storyError } = await this.supabase
        .from('stories')
        .insert({
          user_id: userId,
          child_id: options.childId,
          title: storyResult.title,
          content: storyResult.content,
          pages: pages,
          theme: options.theme,
          mood: options.mood,
          duration: options.duration,
          audio_url: audioUrl,
          audio_duration: audioDuration,
          voice_provider: voiceProvider,
          illustration_style: options.illustrationStyle,
          custom_elements: options.customElements,
          credits_used: cost.total,
          generation_metadata: {
            storyProvider: storyResult.provider,
            storyModel: storyResult.model,
            imageProvider,
            voiceProvider,
            tokensUsed: storyResult.tokensUsed,
            generationTime: Date.now() - startTime,
          },
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (storyError) {
        throw new Error(`Failed to save story: ${storyError.message}`);
      }

      // Deduct credits
      await this.creditService.deductCredits({
        userId,
        amount: cost.total,
        reason: `Story generation: "${storyResult.title}"`,
        relatedEntityId: story.id,
      });

      updateProgress({
        stage: 'complete',
        progress: 100,
        message: 'Your story is ready!',
      });

      return {
        id: story.id,
        title: storyResult.title,
        pages,
        audioUrl,
        audioDuration,
        totalCreditsUsed: cost.total,
        generationTime: Date.now() - startTime,
        providers: {
          story: storyResult.provider,
          image: imageProvider,
          voice: voiceProvider,
        },
      };
    } catch (error) {
      updateProgress({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'An error occurred',
      });

      captureError(error as Error, {
        userId,
        action: 'story_generation',
        metadata: {
          childId: options.childId,
          theme: options.theme,
          duration: options.duration,
        },
      });

      throw error;
    }
  }

  /**
   * Regenerate a specific page's illustration
   */
  async regenerateIllustration(
    storyId: string,
    pageNumber: number,
    prompt: string,
    style?: string,
    quality?: 'standard' | 'hd'
  ): Promise<{ imageUrl: string; creditsUsed: number }> {
    const qualityLevel = quality === 'hd' ? 'premium' : 'standard';
    const creditCost = CreditCosts.illustration[qualityLevel];

    // Get story to find user
    const { data: story, error } = await this.supabase
      .from('stories')
      .select('user_id, pages')
      .eq('id', storyId)
      .single();

    if (error || !story) {
      throw new Error('Story not found');
    }

    // Check credits
    const hasCredits = await this.creditService.hasEnoughCredits(story.user_id, creditCost);
    if (!hasCredits) {
      const balance = await this.creditService.getBalance(story.user_id);
      throw new InsufficientCreditsError(creditCost, balance);
    }

    // Generate new image
    const imageResult = await this.aiService.generateImage({
      prompt,
      style: toImageStyle(style),
      size: '1024x1024',
      quality: quality || 'standard',
    });

    // Update page in story
    const pages = story.pages as GeneratedPage[];
    const pageIndex = pages.findIndex((p) => p.pageNumber === pageNumber);
    if (pageIndex >= 0) {
      pages[pageIndex].imageUrl = imageResult.url;

      await this.supabase
        .from('stories')
        .update({ pages })
        .eq('id', storyId);
    }

    // Deduct credits
    await this.creditService.deductCredits({
      userId: story.user_id,
      amount: creditCost,
      reason: `Illustration regeneration: Page ${pageNumber}`,
      relatedEntityId: storyId,
    });

    return {
      imageUrl: imageResult.url,
      creditsUsed: creditCost,
    };
  }

  /**
   * Regenerate audio for a story
   */
  async regenerateAudio(
    storyId: string,
    voiceId: string,
    voiceProvider?: 'elevenlabs' | 'web'
  ): Promise<{ audioUrl: string; duration: number; creditsUsed: number }> {
    const voiceQuality = voiceProvider === 'elevenlabs' ? 'premium' : 'basic';
    const creditCost = CreditCosts.narration[voiceQuality];

    // Get story
    const { data: story, error } = await this.supabase
      .from('stories')
      .select('user_id, pages')
      .eq('id', storyId)
      .single();

    if (error || !story) {
      throw new Error('Story not found');
    }

    // Check credits
    const hasCredits = await this.creditService.hasEnoughCredits(story.user_id, creditCost);
    if (!hasCredits) {
      const balance = await this.creditService.getBalance(story.user_id);
      throw new InsufficientCreditsError(creditCost, balance);
    }

    // Generate audio
    const pages = story.pages as GeneratedPage[];
    const fullText = pages.map((p) => p.text).join('\n\n');

    const speechRequest: TextToSpeechRequest = {
      text: fullText,
      voiceId,
      stability: 0.5,
      similarityBoost: 0.75,
    };
    const speechResult = await this.aiService.generateSpeech(speechRequest);

    // Convert audio buffer to base64 data URL
    const base64Audio = Buffer.from(speechResult.audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
    const duration = Math.round(speechResult.durationMs / 1000);

    // Update story
    await this.supabase
      .from('stories')
      .update({
        audio_url: audioUrl,
        audio_duration: duration,
        voice_provider: speechResult.provider,
      })
      .eq('id', storyId);

    // Deduct credits
    await this.creditService.deductCredits({
      userId: story.user_id,
      amount: creditCost,
      reason: 'Audio regeneration',
      relatedEntityId: storyId,
    });

    return {
      audioUrl,
      duration,
      creditsUsed: creditCost,
    };
  }
}

// Factory function
export function createStoryOrchestrator(
  supabase: SupabaseClient,
  userId: string
): StoryOrchestrator {
  return new StoryOrchestrator(supabase, userId);
}
