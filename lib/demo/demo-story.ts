// =============================================================================
// Demo Story Content
// =============================================================================
// A pre-generated sample story for visitors to preview the Amari experience
// No API calls needed - completely static content

export interface DemoStoryPage {
  pageNumber: number;
  text: string;
  imageUrl: string;
  imagePrompt: string;
}

export interface DemoStory {
  id: string;
  title: string;
  childName: string;
  tone: string;
  ageGroup: string;
  wordCount: number;
  readingTime: string;
  pages: DemoStoryPage[];
  audioUrl: string | null;
  audioDuration: number | null;
}

// The demo story featuring a child named "Luna"
export const DEMO_STORY: DemoStory = {
  id: 'demo-story-luna',
  title: "Luna and the Starlight Garden",
  childName: "Luna",
  tone: "bedtime-calm",
  ageGroup: "5-7",
  wordCount: 320,
  readingTime: "3 min",
  pages: [
    {
      pageNumber: 1,
      text: `Once upon a time, in a cozy little house at the edge of Maple Street, there lived a curious girl named Luna. She had bright eyes that sparkled like stars and a heart full of wonder.

Every night before bed, Luna would look out her window at the garden below, watching the moonlight dance on the flowers.`,
      imageUrl: "/demo/luna-window.jpg",
      imagePrompt: "A young girl with bright eyes looking out a window at a moonlit garden, warm bedroom lighting, children's book illustration style"
    },
    {
      pageNumber: 2,
      text: `One special evening, Luna noticed something magical. The flowers in the garden were glowing! Soft blues, gentle purples, and warm golds twinkled among the leaves.

"Oh my!" whispered Luna. She tiptoed downstairs in her fuzzy slippers, careful not to wake her sleeping cat, Biscuit.`,
      imageUrl: "/demo/luna-garden-glow.jpg",
      imagePrompt: "Glowing magical flowers in a nighttime garden, bioluminescent blues and purples, whimsical children's illustration"
    },
    {
      pageNumber: 3,
      text: `In the garden, Luna discovered that fireflies had gathered from all around the neighborhood. They were having a celebration!

"Welcome, Luna!" called a friendly firefly named Flicker. "We've been waiting for someone with a kind heart to join our Starlight Garden party."`,
      imageUrl: "/demo/luna-fireflies.jpg",
      imagePrompt: "A little girl surrounded by friendly glowing fireflies in a magical garden at night, warm and inviting atmosphere"
    },
    {
      pageNumber: 4,
      text: `Luna danced with the fireflies until the moon climbed high in the sky. They taught her a special song that made the flowers sway and the stars seem to wink.

When it was time to go, Flicker gave Luna a tiny glowing seed. "Plant this, and you'll always have a piece of the Starlight Garden."`,
      imageUrl: "/demo/luna-seed.jpg",
      imagePrompt: "A firefly giving a glowing magical seed to a young girl, tender moment, soft moonlight, children's book art"
    },
    {
      pageNumber: 5,
      text: `Luna climbed back into her cozy bed, the magical seed safely in her pocket. She smiled as she drifted off to sleep, dreaming of dancing lights and new friends.

And every night after that, her garden glowed just a little brighter than before.

The End`,
      imageUrl: "/demo/luna-sleeping.jpg",
      imagePrompt: "A peaceful young girl sleeping in a cozy bed with moonlight streaming through the window, her garden visible outside glowing softly"
    }
  ],
  // Demo doesn't include real audio - prompts signup
  audioUrl: null,
  audioDuration: null,
};

// AI-generated demo images (created with DALL-E 3)
export const DEMO_PLACEHOLDER_IMAGES: Record<number, string> = {
  1: "url('/demo/luna-page-1.webp') center/cover",
  2: "url('/demo/luna-page-2.webp') center/cover",
  3: "url('/demo/luna-page-3.webp') center/cover",
  4: "url('/demo/luna-page-4.webp') center/cover",
  5: "url('/demo/luna-page-5.webp') center/cover",
};

// Feature highlights shown during demo
export const DEMO_FEATURES = [
  {
    icon: "sparkles",
    title: "AI-Generated Stories",
    description: "Every story is uniquely created for your child"
  },
  {
    icon: "mic",
    title: "Professional Narration",
    description: "Choose from premium voices to bring stories to life"
  },
  {
    icon: "image",
    title: "Beautiful Illustrations",
    description: "Custom artwork generated for each scene"
  },
  {
    icon: "moon",
    title: "Perfect for Bedtime",
    description: "Calming tones designed to help little ones drift off"
  }
];
