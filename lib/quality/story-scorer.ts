/**
 * Story Quality Scoring System
 * Evaluates generated stories across multiple quality dimensions
 */

export interface QualityScore {
  total: number; // 0-100
  breakdown: {
    nameUsage: number; // 0-30: Do requested names appear?
    lengthCompliance: number; // 0-20: Within target word count?
    ageAppropriate: number; // 0-20: Vocabulary matches age?
    noRepetition: number; // 0-15: No excessive repetition?
    structure: number; // 0-15: Has beginning/middle/end?
  };
  issues: string[];
  passed: boolean; // total >= 60
}

export interface StoryRequest {
  storyRequest: string;
  ageGroup: string;
  targetLength: 'quick' | 'medium' | 'epic';
}

// Age-appropriate vocabulary complexity thresholds
const AGE_VOCABULARY_LEVELS = {
  '2-4': { maxSyllables: 2, complexWordThreshold: 0.05 }, // 5% complex words max
  '5-7': { maxSyllables: 3, complexWordThreshold: 0.15 }, // 15% complex words max
  '8-10': { maxSyllables: 4, complexWordThreshold: 0.25 }, // 25% complex words max
};

// Target word count ranges
const LENGTH_TARGETS = {
  quick: { min: 300, max: 400, ideal: 350 },
  medium: { min: 600, max: 800, ideal: 700 },
  epic: { min: 1000, max: 1200, ideal: 1100 },
};

// Story structure markers
const STORY_MARKERS = {
  beginnings: [
    'once upon',
    'long ago',
    'in a',
    'there was',
    'there lived',
    'one day',
  ],
  character_intro: [
    'named',
    'called',
    'who was',
    'who loved',
    'lived in',
  ],
  resolution: [
    'the end',
    'happily',
    'forever',
    'lived happily',
    'from that day',
    'and so',
  ],
};

/**
 * Extract names from the story request
 */
function extractNames(request: string): string[] {
  const names: string[] = [];

  // Look for "name is X" or "named X" patterns
  const namePatterns = [
    /name(?:d)?\s+(?:is\s+)?([A-Z][a-z]+)/g,
    /called\s+([A-Z][a-z]+)/g,
    /\b([A-Z][a-z]+)\s+(?:the|who|and)/g,
  ];

  for (const pattern of namePatterns) {
    const matches = request.matchAll(pattern);
    for (const match of matches) {
      const name = match[1];
      if (name && !names.includes(name) && name.length > 1) {
        names.push(name);
      }
    }
  }

  return names;
}

/**
 * Count word occurrences in text (case-insensitive)
 */
function countOccurrences(text: string, word: string): number {
  const regex = new RegExp(`\\b${word}\\b`, 'gi');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Score name usage (0-30 points)
 */
function scoreNameUsage(story: string, request: string): {
  score: number;
  issues: string[];
} {
  const names = extractNames(request);
  const issues: string[] = [];

  if (names.length === 0) {
    return { score: 30, issues }; // No names requested, full points
  }

  let totalOccurrences = 0;
  const storyLower = story.toLowerCase();

  for (const name of names) {
    const count = countOccurrences(story, name);
    totalOccurrences += count;

    if (count === 0) {
      issues.push(`Requested name "${name}" not found in story`);
    } else if (count < 3) {
      issues.push(`Name "${name}" appears only ${count} time(s), should appear at least 3 times`);
    }
  }

  // Score based on average occurrences per name
  const avgOccurrences = totalOccurrences / names.length;
  let score = 0;

  if (avgOccurrences >= 5) {
    score = 30;
  } else if (avgOccurrences >= 3) {
    score = 25;
  } else if (avgOccurrences >= 1) {
    score = 15;
  } else {
    score = 0;
  }

  return { score, issues };
}

/**
 * Score length compliance (0-20 points)
 */
function scoreLengthCompliance(
  story: string,
  targetLength: 'quick' | 'medium' | 'epic'
): {
  score: number;
  issues: string[];
} {
  const wordCount = story.trim().split(/\s+/).length;
  const target = LENGTH_TARGETS[targetLength];
  const issues: string[] = [];

  if (wordCount < target.min) {
    issues.push(
      `Story is too short: ${wordCount} words (expected ${target.min}-${target.max})`
    );
    const deficit = target.min - wordCount;
    const percentShort = (deficit / target.ideal) * 100;
    return { score: Math.max(0, 20 - Math.floor(percentShort / 5)), issues };
  }

  if (wordCount > target.max) {
    issues.push(
      `Story is too long: ${wordCount} words (expected ${target.min}-${target.max})`
    );
    const excess = wordCount - target.max;
    const percentLong = (excess / target.ideal) * 100;
    return { score: Math.max(0, 20 - Math.floor(percentLong / 5)), issues };
  }

  // Within range - calculate score based on closeness to ideal
  const deviation = Math.abs(wordCount - target.ideal);
  const deviationPercent = (deviation / target.ideal) * 100;

  if (deviationPercent < 5) {
    return { score: 20, issues };
  } else if (deviationPercent < 10) {
    return { score: 18, issues };
  } else if (deviationPercent < 15) {
    return { score: 16, issues };
  } else {
    return { score: 14, issues };
  }
}

/**
 * Count syllables in a word (approximate)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;

  const vowels = 'aeiouy';
  let count = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }

  // Adjust for silent 'e'
  if (word.endsWith('e')) {
    count--;
  }

  return Math.max(1, count);
}

/**
 * Score age appropriateness (0-20 points)
 */
function scoreAgeAppropriate(story: string, ageGroup: string): {
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  const level = AGE_VOCABULARY_LEVELS[ageGroup as keyof typeof AGE_VOCABULARY_LEVELS];

  if (!level) {
    return { score: 20, issues }; // Unknown age group, give full points
  }

  const words = story
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  let complexWords = 0;

  for (const word of words) {
    const syllables = countSyllables(word);
    if (syllables > level.maxSyllables) {
      complexWords++;
    }
  }

  const complexWordRatio = complexWords / words.length;

  if (complexWordRatio <= level.complexWordThreshold) {
    return { score: 20, issues };
  }

  if (complexWordRatio <= level.complexWordThreshold * 1.5) {
    issues.push(
      `Some vocabulary may be too complex for age ${ageGroup} (${(complexWordRatio * 100).toFixed(1)}% complex words)`
    );
    return { score: 15, issues };
  }

  issues.push(
    `Vocabulary is too complex for age ${ageGroup} (${(complexWordRatio * 100).toFixed(1)}% complex words, expected <${(level.complexWordThreshold * 100).toFixed(1)}%)`
  );
  return { score: Math.max(0, 20 - Math.floor(complexWordRatio * 100)), issues };
}

/**
 * Score repetition (0-15 points)
 */
function scoreNoRepetition(story: string): {
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  const sentences = story.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  // Check for repeated sentences
  const sentenceMap = new Map<string, number>();
  let repeatedSentences = 0;

  for (const sentence of sentences) {
    const normalized = sentence.trim().toLowerCase();
    if (normalized.length < 10) continue; // Skip very short sentences

    const count = (sentenceMap.get(normalized) || 0) + 1;
    sentenceMap.set(normalized, count);

    if (count > 1) {
      repeatedSentences++;
    }
  }

  if (repeatedSentences > 0) {
    issues.push(`Found ${repeatedSentences} repeated sentence(s)`);
  }

  // Check for repeated phrases (3+ words)
  const phrases = new Map<string, number>();
  const words = story.split(/\s+/);
  let repeatedPhrases = 0;

  for (let i = 0; i < words.length - 2; i++) {
    const phrase = words
      .slice(i, i + 3)
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, '');

    if (phrase.length < 10) continue; // Skip short phrases

    const count = (phrases.get(phrase) || 0) + 1;
    phrases.set(phrase, count);

    if (count > 2) {
      // Allow 2 repetitions, penalize 3+
      repeatedPhrases++;
    }
  }

  if (repeatedPhrases > 0) {
    issues.push(`Found ${repeatedPhrases} excessively repeated phrase(s)`);
  }

  const totalRepetition = repeatedSentences + Math.floor(repeatedPhrases / 2);

  if (totalRepetition === 0) {
    return { score: 15, issues };
  } else if (totalRepetition <= 2) {
    return { score: 12, issues };
  } else if (totalRepetition <= 4) {
    return { score: 8, issues };
  } else {
    return { score: Math.max(0, 15 - totalRepetition), issues };
  }
}

/**
 * Score story structure (0-15 points)
 */
function scoreStructure(story: string): {
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  const storyLower = story.toLowerCase();
  let score = 0;

  // Check for beginning (5 points)
  const hasBeginning = STORY_MARKERS.beginnings.some((marker) =>
    storyLower.includes(marker)
  );

  if (hasBeginning) {
    score += 5;
  } else {
    issues.push('Story lacks a clear beginning marker');
  }

  // Check for character introduction (5 points)
  const hasCharacterIntro = STORY_MARKERS.character_intro.some((marker) =>
    storyLower.includes(marker)
  );

  if (hasCharacterIntro) {
    score += 5;
  } else {
    issues.push('Story lacks clear character introduction');
  }

  // Check for resolution (5 points)
  const hasResolution = STORY_MARKERS.resolution.some((marker) =>
    storyLower.includes(marker)
  );

  if (hasResolution) {
    score += 5;
  } else {
    issues.push('Story lacks a clear ending or resolution');
  }

  return { score, issues };
}

/**
 * Score the overall quality of a generated story
 */
export function scoreStoryQuality(
  story: string,
  request: StoryRequest
): QualityScore {
  const allIssues: string[] = [];

  // Score each dimension
  const nameUsageResult = scoreNameUsage(story, request.storyRequest);
  const lengthResult = scoreLengthCompliance(story, request.targetLength);
  const ageResult = scoreAgeAppropriate(story, request.ageGroup);
  const repetitionResult = scoreNoRepetition(story);
  const structureResult = scoreStructure(story);

  allIssues.push(...nameUsageResult.issues);
  allIssues.push(...lengthResult.issues);
  allIssues.push(...ageResult.issues);
  allIssues.push(...repetitionResult.issues);
  allIssues.push(...structureResult.issues);

  const breakdown = {
    nameUsage: nameUsageResult.score,
    lengthCompliance: lengthResult.score,
    ageAppropriate: ageResult.score,
    noRepetition: repetitionResult.score,
    structure: structureResult.score,
  };

  const total =
    breakdown.nameUsage +
    breakdown.lengthCompliance +
    breakdown.ageAppropriate +
    breakdown.noRepetition +
    breakdown.structure;

  return {
    total,
    breakdown,
    issues: allIssues,
    passed: total >= 60,
  };
}

/**
 * Get a human-readable quality grade
 */
export function getQualityGrade(score: number): {
  grade: string;
  description: string;
} {
  if (score >= 90) {
    return { grade: 'A+', description: 'Excellent story quality' };
  } else if (score >= 80) {
    return { grade: 'A', description: 'Very good story quality' };
  } else if (score >= 70) {
    return { grade: 'B', description: 'Good story quality' };
  } else if (score >= 60) {
    return { grade: 'C', description: 'Acceptable story quality' };
  } else if (score >= 50) {
    return { grade: 'D', description: 'Poor story quality - consider regenerating' };
  } else {
    return { grade: 'F', description: 'Failed quality check - regeneration recommended' };
  }
}
