/**
 * Output Content Moderator
 *
 * Validates generated story content using OpenAI's Moderation API and custom rules.
 * Ensures that LLM-generated stories are safe and age-appropriate for children.
 */

import OpenAI from 'openai';

export interface ModerationResult {
  safe: boolean;
  flagged: boolean;
  categories: string[];
  reason?: string;
  shouldRegenerate: boolean;
}

interface OpenAIModerationResponse {
  id: string;
  model: string;
  results: Array<{
    flagged: boolean;
    categories: {
      sexual: boolean;
      hate: boolean;
      harassment: boolean;
      'self-harm': boolean;
      'sexual/minors': boolean;
      'hate/threatening': boolean;
      'violence/graphic': boolean;
      'self-harm/intent': boolean;
      'self-harm/instructions': boolean;
      'harassment/threatening': boolean;
      violence: boolean;
    };
    category_scores: Record<string, number>;
  }>;
}

/**
 * Age-appropriateness patterns that might be scary or heavy for young children
 * These don't block the content but flag it for review
 */
const AGE_APPROPRIATENESS_PATTERNS = {
  scary: {
    threshold: 3, // Number of occurrences before flagging
    patterns: [
      /\b(monster|monsters)\b/gi,
      /\b(nightmare|nightmares)\b/gi,
      /\b(scary|terrifying|frightening)\b/gi,
      /\b(afraid|fear|feared)\b/gi,
      /\b(dark|darkness|shadow|shadows)\b/gi,
      /\b(creepy|spooky|eerie)\b/gi,
    ],
    reason: 'Story may contain scary themes for young children',
  },
  heavyThemes: {
    threshold: 1, // Even one occurrence flags this
    patterns: [
      /\b(death|died|dying|dead)\b/gi,
      /\b(loss|lost forever|never return)\b/gi,
      /\b(abandon|abandoned|left behind)\b/gi,
      /\b(alone|lonely|isolation)\b/gi,
      /\b(sad|sadness|grief|sorrow)\b/gi,
    ],
    reason: 'Story contains themes that might be emotionally heavy for young children',
  },
};

/**
 * Checks for age-inappropriate patterns in the generated story
 *
 * @param content - The story content to check
 * @returns Array of flagged categories with reasons
 */
function checkAgeAppropriateness(content: string): Array<{ category: string; reason: string; count: number }> {
  const flags: Array<{ category: string; reason: string; count: number }> = [];

  for (const [category, config] of Object.entries(AGE_APPROPRIATENESS_PATTERNS)) {
    let totalMatches = 0;

    for (const pattern of config.patterns) {
      const matches = content.match(pattern);
      if (matches) {
        totalMatches += matches.length;
      }
    }

    if (totalMatches >= config.threshold) {
      flags.push({
        category,
        reason: config.reason,
        count: totalMatches,
      });
    }
  }

  return flags;
}

/**
 * Initialize OpenAI client
 * Lazy initialization to avoid errors if API key is not set
 */
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    openaiClient = new OpenAI({
      apiKey,
    });
  }

  return openaiClient;
}

/**
 * Moderates generated story content using OpenAI's Moderation API and custom rules
 *
 * @param content - The generated story content to moderate
 * @returns ModerationResult indicating if content is safe and should be shown
 *
 * @throws {Error} If OpenAI API key is not configured
 * @throws {Error} If moderation API request fails
 *
 * @example
 * ```typescript
 * const result = await moderateStoryContent(generatedStory);
 * if (result.safe && !result.shouldRegenerate) {
 *   // Safe to show to user
 *   displayStory(generatedStory);
 * } else {
 *   // Regenerate or show error
 *   handleUnsafeContent(result);
 * }
 * ```
 */
export async function moderateStoryContent(content: string): Promise<ModerationResult> {
  if (!content || typeof content !== 'string') {
    return {
      safe: false,
      flagged: true,
      categories: ['invalid-input'],
      reason: 'Invalid content provided for moderation',
      shouldRegenerate: false,
    };
  }

  const normalizedContent = content.trim();

  if (normalizedContent.length === 0) {
    return {
      safe: false,
      flagged: true,
      categories: ['empty-content'],
      reason: 'Empty content cannot be moderated',
      shouldRegenerate: true,
    };
  }

  try {
    // Call OpenAI Moderation API
    const openai = getOpenAIClient();
    const moderationResponse = (await openai.moderations.create({
      input: normalizedContent,
    })) as unknown as OpenAIModerationResponse;

    const result = moderationResponse.results[0];
    const flaggedCategories: string[] = [];

    // Check each category
    if (result.flagged) {
      for (const [category, isFlagged] of Object.entries(result.categories)) {
        if (isFlagged) {
          flaggedCategories.push(category);
        }
      }

      // Determine severity and action
      const criticalCategories = [
        'sexual',
        'sexual/minors',
        'violence/graphic',
        'self-harm/intent',
        'self-harm/instructions',
        'hate/threatening',
        'harassment/threatening',
      ];

      const hasCriticalViolation = flaggedCategories.some((cat) =>
        criticalCategories.includes(cat)
      );

      return {
        safe: false,
        flagged: true,
        categories: flaggedCategories,
        reason: hasCriticalViolation
          ? 'Content contains severe policy violations'
          : 'Content flagged by moderation system',
        shouldRegenerate: true,
      };
    }

    // Check age-appropriateness (doesn't block, just flags)
    const ageFlags = checkAgeAppropriateness(normalizedContent);

    if (ageFlags.length > 0) {
      const categories = ageFlags.map((f) => f.category);
      const reasons = ageFlags.map((f) => `${f.reason} (${f.count} occurrences)`).join('; ');

      // For bedtime stories, scary themes might be acceptable in moderation
      // But heavy themes should trigger regeneration
      const hasHeavyThemes = ageFlags.some((f) => f.category === 'heavyThemes');

      return {
        safe: !hasHeavyThemes, // Safe if only scary themes, not safe if heavy themes
        flagged: true,
        categories,
        reason: reasons,
        shouldRegenerate: hasHeavyThemes,
      };
    }

    // All checks passed
    return {
      safe: true,
      flagged: false,
      categories: [],
      shouldRegenerate: false,
    };
  } catch (error) {
    // Log error but don't expose API details to user
    console.error('Moderation API error:', error);

    // If API fails, fall back to basic checks
    const ageFlags = checkAgeAppropriateness(normalizedContent);

    if (ageFlags.length > 0) {
      const hasHeavyThemes = ageFlags.some((f) => f.category === 'heavyThemes');

      return {
        safe: !hasHeavyThemes,
        flagged: true,
        categories: ageFlags.map((f) => f.category),
        reason: 'Moderation service unavailable, using basic safety checks',
        shouldRegenerate: hasHeavyThemes,
      };
    }

    // If moderation fails and no obvious issues, err on the side of caution
    throw new Error('Content moderation failed. Please try again.');
  }
}

/**
 * Batch moderate multiple story segments
 * Useful for moderating stories with multiple chapters or sections
 *
 * @param segments - Array of story content segments
 * @returns Array of moderation results for each segment
 */
export async function moderateStorySegments(
  segments: string[]
): Promise<ModerationResult[]> {
  // Process in parallel for better performance
  const results = await Promise.all(
    segments.map((segment) => moderateStoryContent(segment))
  );

  return results;
}

/**
 * Get a user-friendly message for moderation results
 *
 * @param result - The moderation result
 * @returns User-friendly message
 */
export function getModerationMessage(result: ModerationResult): string {
  if (!result.flagged) {
    return '';
  }

  if (!result.safe) {
    const categoryMessages: Record<string, string> = {
      sexual: 'inappropriate adult content',
      'sexual/minors': 'inappropriate content',
      violence: 'violent content',
      'violence/graphic': 'graphic violent content',
      'self-harm': 'harmful content',
      'self-harm/intent': 'harmful content',
      'self-harm/instructions': 'harmful content',
      hate: 'hateful content',
      'hate/threatening': 'threatening content',
      harassment: 'harassing content',
      'harassment/threatening': 'threatening content',
    };

    const matchedCategories = result.categories
      .map((cat) => categoryMessages[cat])
      .filter(Boolean);

    if (matchedCategories.length > 0) {
      return `This story contains ${matchedCategories.join(', ')} and cannot be shown. We'll generate a new story.`;
    }

    return 'This story contains inappropriate content. We\'ll generate a new story.';
  }

  // Flagged but safe (age-appropriateness warnings)
  if (result.categories.includes('scary')) {
    return 'This story contains some spooky elements. It might be best for slightly older children.';
  }

  if (result.categories.includes('heavyThemes')) {
    return 'This story touches on emotional themes. We\'ll generate a lighter version.';
  }

  return 'This story has been reviewed and adjusted for age-appropriateness.';
}

/**
 * Check if moderation result requires action
 *
 * @param result - The moderation result
 * @returns true if story should be regenerated
 */
export function requiresRegeneration(result: ModerationResult): boolean {
  return result.shouldRegenerate;
}
