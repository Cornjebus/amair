/**
 * Generate demo story images using DALL-E 3
 * Run once: npx tsx scripts/generate-demo-images.ts
 */

import OpenAI from 'openai';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in .env.local');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEMO_OUTPUT_DIR = path.join(process.cwd(), 'public', 'demo');

// The demo story scenes with prompts optimized for DALL-E 3
// Diverse representation: 3 brown/dark-skinned children, 2 white children (1 with red hair)
const DEMO_SCENES = [
  {
    pageNumber: 1,
    filename: 'luna-page-1.webp',
    prompt: `A warm, cozy children's book illustration of a young Black girl with beautiful natural curly hair and bright curious eyes, sitting at her bedroom window at night. She's wearing soft purple pajamas and looking out at a moonlit garden below. Warm bedroom lighting, soft pastels, dreamy watercolor style, child-friendly, peaceful bedtime mood.`,
  },
  {
    pageNumber: 2,
    filename: 'luna-page-2.webp',
    prompt: `A magical children's book illustration of a nighttime garden with flowers softly glowing in blues, purples, and warm golds. Bioluminescent petals twinkle among green leaves. A young South Asian boy with warm brown skin and dark hair in pajamas and fuzzy slippers stands at the garden entrance, amazed. Watercolor style, dreamy and enchanting, child-friendly.`,
  },
  {
    pageNumber: 3,
    filename: 'luna-page-3.webp',
    prompt: `A whimsical children's book illustration of a young Latina girl with warm caramel skin and long dark braided hair, surrounded by dozens of friendly, glowing fireflies in a magical garden at night. The fireflies create warm golden light around her delighted face. One larger firefly hovers near her, seeming to speak. Soft watercolor style, joyful and magical, child-friendly.`,
  },
  {
    pageNumber: 4,
    filename: 'luna-page-4.webp',
    prompt: `A beautiful children's book illustration of a young white girl with bright red curly hair and freckles, dancing joyfully among fireflies under a starry night sky. She holds a tiny glowing seed in her palm, gifted by a friendly firefly. The moon is bright, flowers sway gently, stars twinkle. Watercolor style, magical and warm, child-friendly.`,
  },
  {
    pageNumber: 5,
    filename: 'luna-page-5.webp',
    prompt: `A peaceful children's book illustration of a young white boy with soft blonde hair sleeping peacefully in his cozy bed, a gentle smile on his face. Soft moonlight streams through the window, and outside we can see the garden glowing softly with magical light. Warm, dreamy watercolor style, perfect for bedtime, child-friendly.`,
  },
];

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function generateImage(scene: typeof DEMO_SCENES[0]): Promise<string> {
  console.log(`\n📸 Generating image for page ${scene.pageNumber}...`);
  console.log(`   Prompt: ${scene.prompt.substring(0, 80)}...`);

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: scene.prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error('No image URL returned from OpenAI');
  }

  console.log(`   ✅ Image generated successfully`);

  // Download and save
  const imageBuffer = await downloadImage(imageUrl);
  const outputPath = path.join(DEMO_OUTPUT_DIR, scene.filename);
  await writeFile(outputPath, imageBuffer);
  console.log(`   💾 Saved to: ${outputPath}`);

  return `/demo/${scene.filename}`;
}

async function main() {
  console.log('🎨 Generating Demo Story Images');
  console.log('================================\n');

  // Ensure output directory exists
  if (!existsSync(DEMO_OUTPUT_DIR)) {
    await mkdir(DEMO_OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created directory: ${DEMO_OUTPUT_DIR}`);
  }

  const results: Record<number, string> = {};

  for (const scene of DEMO_SCENES) {
    try {
      const localPath = await generateImage(scene);
      results[scene.pageNumber] = localPath;
    } catch (error) {
      console.error(`   ❌ Failed to generate page ${scene.pageNumber}:`, error);
    }
  }

  console.log('\n\n✨ Generation Complete!');
  console.log('========================');
  console.log('\nUpdate lib/demo/demo-story.ts with these paths:\n');
  console.log('export const DEMO_PLACEHOLDER_IMAGES: Record<number, string> = {');
  for (const [page, path] of Object.entries(results)) {
    console.log(`  ${page}: "url('${path}') center/cover",`);
  }
  console.log('};');
}

main().catch(console.error);
