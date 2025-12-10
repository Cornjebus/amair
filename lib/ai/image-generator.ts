import OpenAI from 'openai';
import { ART_STYLES, type ArtStyle } from './art-styles';

// Re-export art styles from dedicated module
export { ART_STYLES, type ArtStyle } from './art-styles';

// Safety prompt to ensure child-appropriate content
const SAFETY_SUFFIX = `
CRITICAL REQUIREMENTS FOR THIS IMAGE:
- Child-friendly content only, suitable for ages 3-10
- No scary, violent, or dark imagery whatsoever
- Warm, gentle, and inviting visuals
- Soft, pleasant lighting with no harsh shadows
- Happy, friendly, or peaceful expressions on all characters
- No weapons, blood, monsters, or anything frightening
- Appropriate and calming for bedtime viewing
- Wholesome family-friendly scene
`;

export interface ImageGenerationRequest {
  prompt: string;
  style: ArtStyle;
  storyTitle?: string;
  characterNames?: string[];
}

export interface ImageGenerationResponse {
  imageUrl: string;
  revisedPrompt?: string;
  model: string;
}

// Singleton OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

/**
 * Generate a single illustration for a story scene
 */
export async function generateStoryImage(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  const openai = getOpenAIClient();
  const styleConfig = ART_STYLES[request.style];

  // Build the full prompt with style and safety requirements
  const fullPrompt = `
Create a beautiful children's book illustration for a bedtime story.

Scene to illustrate: ${request.prompt}

${request.storyTitle ? `This is from the story: "${request.storyTitle}"` : ''}
${request.characterNames?.length ? `Characters in scene: ${request.characterNames.join(', ')}` : ''}

Art Style: ${styleConfig.prompt}

${SAFETY_SUFFIX}
  `.trim();

  console.log('[image-generator] Generating image with prompt length:', fullPrompt.length);

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
    });

    const imageData = response.data?.[0];

    if (!imageData?.url) {
      throw new Error('No image URL returned from OpenAI');
    }

    return {
      imageUrl: imageData.url,
      revisedPrompt: imageData.revised_prompt,
      model: 'dall-e-3',
    };
  } catch (error: any) {
    console.error('[image-generator] Error generating image:', error);

    // Check for content policy violation
    if (error.code === 'content_policy_violation') {
      throw new Error('The image prompt was flagged by our safety systems. Please try a different scene.');
    }

    throw error;
  }
}

/**
 * Extract key scenes from a story for illustration
 */
export async function extractScenesForIllustration(
  storyContent: string,
  storyTitle: string,
  numberOfScenes: number = 4
): Promise<string[]> {
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert at identifying the most visually compelling and emotionally resonant scenes in children's bedtime stories for illustration.

Your job is to extract ${numberOfScenes} key scenes that would make beautiful, child-friendly illustrations.

Rules:
- Choose scenes with clear visual elements (characters, settings, actions)
- Prefer scenes that capture emotional moments (joy, wonder, friendship)
- Avoid any scary, sad, or dark moments
- Make each scene description detailed enough for an illustrator
- Include character positions, expressions, and background elements
- Keep descriptions to 2-3 sentences each
- Focus on warmth, magic, and wonder`,
      },
      {
        role: 'user',
        content: `Story Title: "${storyTitle}"

Story Content:
${storyContent}

Extract ${numberOfScenes} key scenes for illustration. Return ONLY a JSON array of scene descriptions, nothing else.

Example format:
["A young girl with curly brown hair discovers a glowing butterfly in a moonlit garden, her eyes wide with wonder as the butterfly lands on her outstretched finger.", "The friendly forest animals gather around a cozy campfire, sharing stories and marshmallows under a starry sky."]`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content || '[]';

  try {
    // Parse the JSON array of scenes
    const scenes = JSON.parse(content);
    if (Array.isArray(scenes)) {
      return scenes.slice(0, numberOfScenes);
    }
  } catch (e) {
    console.error('[image-generator] Failed to parse scenes:', e);
  }

  // Fallback: split by sentences and take key ones
  return [
    `A beautiful opening scene from "${storyTitle}" showing the main character beginning their adventure.`,
    `A magical moment from the middle of "${storyTitle}" where something wonderful happens.`,
    `The heartwarming conclusion of "${storyTitle}" where everyone is happy and at peace.`,
  ].slice(0, numberOfScenes);
}

/**
 * Download an image from URL and return as Buffer
 */
export async function downloadImageAsBuffer(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function getDefaultStyle(): ArtStyle {
  return 'watercolor';
}

export function getAllStyles(): typeof ART_STYLES {
  return ART_STYLES;
}
