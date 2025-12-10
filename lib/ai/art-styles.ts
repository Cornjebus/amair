// Art styles available for story illustrations
export type ArtStyle =
  | 'watercolor'
  | 'pixar'
  | 'cartoon'
  | 'storybook'
  | 'whimsical';

export const ART_STYLES: Record<ArtStyle, { name: string; description: string; prompt: string }> = {
  watercolor: {
    name: 'Watercolor Dreams',
    description: 'Soft, dreamy watercolor illustrations',
    prompt: 'soft watercolor illustration, children\'s book style, gentle pastel colors, hand-painted feel, dreamy atmosphere, flowing brushstrokes',
  },
  pixar: {
    name: 'Pixar Magic',
    description: '3D animated movie style',
    prompt: '3D rendered Pixar-style illustration, warm cinematic lighting, expressive characters, smooth textures, vibrant colors, high quality render',
  },
  cartoon: {
    name: 'Playful Cartoon',
    description: 'Bright, fun cartoon style',
    prompt: 'vibrant cartoon style illustration, bold outlines, bright saturated colors, playful and fun, animated look, friendly characters',
  },
  storybook: {
    name: 'Classic Storybook',
    description: 'Traditional children\'s book art',
    prompt: 'classic storybook illustration, detailed backgrounds, whimsical, nostalgic golden age illustration style, warm tones, enchanting',
  },
  whimsical: {
    name: 'Whimsical Fantasy',
    description: 'Magical, fantastical style',
    prompt: 'whimsical fantasy illustration, magical atmosphere, sparkling details, ethereal lighting, enchanted forest feel, soft glow effects',
  },
};
