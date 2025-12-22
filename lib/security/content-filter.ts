/**
 * Content Filter for User Input
 *
 * Validates and sanitizes user-provided story requests before sending to LLM.
 * Blocks harmful content, prompt injections, and inappropriate themes for children's stories.
 */

export interface ContentFilterResult {
  safe: boolean;
  blocked: boolean;
  reason?: string;
  category?: 'violence' | 'adult' | 'injection' | 'harmful' | 'inappropriate' | 'substances';
  sanitizedText?: string;
}

interface PatternRule {
  category: ContentFilterResult['category'];
  patterns: RegExp[];
  severity: 'block' | 'sanitize';
  reason: string;
}

/**
 * Pattern rules for content filtering
 * Organized by category with different severity levels
 */
const FILTER_RULES: PatternRule[] = [
  // Prompt Injection Attempts
  {
    category: 'injection',
    severity: 'block',
    reason: 'Potential prompt injection detected',
    patterns: [
      /ignore\s+(all\s+)?(previous\s+)?(instructions|rules|prompts)/gi,
      /system\s+prompt/gi,
      /you\s+are\s+now/gi,
      /pretend\s+you/gi,
      /act\s+as\s+if/gi,
      /disregard\s+(all\s+)?(previous|above|prior)/gi,
      /forget\s+(everything|all|your|previous)/gi,
      /new\s+instructions/gi,
      /override\s+your/gi,
      /bypass\s+(your\s+)?(instructions|rules|safety)/gi,
    ],
  },
  // Violence
  {
    category: 'violence',
    severity: 'block',
    reason: 'Violent content not appropriate for children',
    patterns: [
      /\b(kill|killing|killed|kills)\b/gi,
      /\b(murder|murdering|murdered)\b/gi,
      /\b(death|dead|dying|die)\b/gi,
      /\b(blood|bloody|bleeding|bleed)\b/gi,
      /\b(weapon|weapons|gun|guns|knife|knives|sword|swords)\b/gi,
      /\b(hurt|hurting|pain|painful|torture)\b/gi,
      /\b(attack|attacking|attacked|attacks)\b/gi,
      /\b(fight|fighting|fought|fights|combat)\b/gi,
      /\b(shoot|shooting|shot|shoots)\b/gi,
      /\b(stab|stabbing|stabbed|stabs)\b/gi,
    ],
  },
  // Adult Content
  {
    category: 'adult',
    severity: 'block',
    reason: 'Adult content not appropriate for children',
    patterns: [
      /\b(sexual|sex|sexy|porn|pornography)\b/gi,
      /\b(nude|nudity|naked|undressed)\b/gi,
      /\b(erotic|arousal|aroused)\b/gi,
      /\b(intimate|intimacy)\b(?!.*friendship)/gi, // Allow "intimate friendship"
    ],
  },
  // Substances
  {
    category: 'substances',
    severity: 'block',
    reason: 'Substance-related content not appropriate for children',
    patterns: [
      /\b(drug|drugs|narcotic|narcotics)\b/gi,
      /\b(alcohol|alcoholic|drunk|drinking)\b/gi,
      /\b(smoking|smoke|cigarette|cigarettes|tobacco)\b/gi,
      /\b(beer|wine|vodka|whiskey|liquor)\b/gi,
      /\b(weed|marijuana|cannabis|cocaine|heroin|meth)\b/gi,
    ],
  },
  // Harmful Content
  {
    category: 'harmful',
    severity: 'block',
    reason: 'Harmful content that could endanger children',
    patterns: [
      /\b(suicide|suicidal|kill\s+myself)\b/gi,
      /\b(self[- ]harm|cutting|hurt\s+myself)\b/gi,
      /\b(bomb|explosive|terrorism|terrorist)\b/gi,
      /\b(poison|poisoning|poisoned)\b/gi,
    ],
  },
  // Inappropriate Themes (sanitize instead of block)
  {
    category: 'inappropriate',
    severity: 'sanitize',
    reason: 'Content sanitized for age-appropriateness',
    patterns: [
      /\b(stupid|dumb|idiot|moron)\b/gi,
      /\b(hate|hates|hating|hatred)\b/gi,
      /\b(ugly|hideous|disgusting)\b/gi,
    ],
  },
];

/**
 * Sanitization replacements for words that can be cleaned up
 */
const SANITIZATION_MAP: Record<string, string> = {
  stupid: 'silly',
  dumb: 'silly',
  idiot: 'silly person',
  moron: 'silly person',
  hate: 'dislike',
  hates: 'dislikes',
  hating: 'disliking',
  hatred: 'strong dislike',
  ugly: 'not pretty',
  hideous: 'unpleasant',
  disgusting: 'yucky',
};

/**
 * Filters and validates user input for story generation
 *
 * @param text - The user's story request text
 * @returns ContentFilterResult with safety status and sanitized text if applicable
 *
 * @example
 * ```typescript
 * const result = filterInputContent("A story about a brave knight");
 * if (!result.blocked) {
 *   // Safe to proceed
 *   generateStory(result.sanitizedText || text);
 * }
 * ```
 */
export function filterInputContent(text: string): ContentFilterResult {
  if (!text || typeof text !== 'string') {
    return {
      safe: false,
      blocked: true,
      reason: 'Invalid input text',
      category: 'inappropriate',
    };
  }

  // Trim and normalize whitespace
  const normalizedText = text.trim().replace(/\s+/g, ' ');

  if (normalizedText.length === 0) {
    return {
      safe: false,
      blocked: true,
      reason: 'Empty input text',
      category: 'inappropriate',
    };
  }

  if (normalizedText.length > 2000) {
    return {
      safe: false,
      blocked: true,
      reason: 'Input text too long (max 2000 characters)',
      category: 'inappropriate',
    };
  }

  let sanitizedText = normalizedText;
  let foundIssues: Array<{ category: string; reason: string }> = [];

  // Check each rule
  for (const rule of FILTER_RULES) {
    for (const pattern of rule.patterns) {
      const matches = normalizedText.match(pattern);

      if (matches && matches.length > 0) {
        if (rule.severity === 'block') {
          // Block immediately for severe violations
          return {
            safe: false,
            blocked: true,
            reason: rule.reason,
            category: rule.category,
          };
        } else if (rule.severity === 'sanitize') {
          // Sanitize the content
          foundIssues.push({
            category: rule.category || 'inappropriate',
            reason: rule.reason,
          });

          // Replace with sanitized versions
          sanitizedText = sanitizedText.replace(pattern, (match) => {
            const lowerMatch = match.toLowerCase().trim();
            return SANITIZATION_MAP[lowerMatch] || match;
          });
        }
      }
    }
  }

  // If we found sanitizable issues but no blocking issues
  if (foundIssues.length > 0) {
    return {
      safe: true,
      blocked: false,
      reason: foundIssues[0].reason,
      category: foundIssues[0].category as ContentFilterResult['category'],
      sanitizedText,
    };
  }

  // All clear
  return {
    safe: true,
    blocked: false,
    sanitizedText: normalizedText,
  };
}

/**
 * Quick check if text contains any blocked patterns
 * Useful for real-time validation in UI
 *
 * @param text - Text to check
 * @returns true if text is safe, false if blocked
 */
export function isContentSafe(text: string): boolean {
  const result = filterInputContent(text);
  return !result.blocked;
}

/**
 * Get a user-friendly error message for blocked content
 *
 * @param result - The content filter result
 * @returns User-friendly error message
 */
export function getBlockedContentMessage(result: ContentFilterResult): string {
  if (!result.blocked) {
    return '';
  }

  const categoryMessages: Record<string, string> = {
    injection: 'Your story request contains invalid instructions. Please describe the story you want naturally.',
    violence: 'This story request contains violent themes that aren\'t appropriate for children. Let\'s create a gentler adventure!',
    adult: 'This content isn\'t appropriate for children\'s stories. Let\'s keep it family-friendly!',
    substances: 'This theme isn\'t suitable for children\'s stories. How about a different adventure?',
    harmful: 'This content could be harmful. Let\'s create a positive, uplifting story instead!',
    inappropriate: 'This request contains inappropriate content. Please try describing your story differently.',
  };

  return result.category
    ? categoryMessages[result.category] || 'This content cannot be used for story generation.'
    : 'This content cannot be used for story generation.';
}
