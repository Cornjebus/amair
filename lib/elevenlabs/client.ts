import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Singleton client instance
let client: ElevenLabsClient | null = null;

export function getElevenLabsClient(): ElevenLabsClient {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('Missing ELEVENLABS_API_KEY environment variable');
  }

  if (!client) {
    client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }

  return client;
}

// Voice configurations for MyAmari
// These are curated voices suitable for children's bedtime stories
export const STORY_VOICES = {
  // Free tier voices (built-in, no premium charge)
  free: [
    {
      id: 'EXAVITQu4vr4xnSDxMaL', // Sarah - soft, warm female
      name: 'Sarah',
      description: 'Warm and gentle',
      gender: 'female',
      preview: 'A soft, nurturing voice perfect for calming bedtime stories',
      isPremium: false,
    },
    {
      id: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - friendly male
      name: 'Liam',
      description: 'Friendly storyteller',
      gender: 'male',
      preview: 'A friendly, engaging voice great for adventure stories',
      isPremium: false,
    },
  ],
  // Premium voices (count against premium_voices_used)
  premium: [
    {
      id: 'jBpfuIE2acCO8z3wKNLl', // Gigi - young, expressive female
      name: 'Luna',
      description: 'Magical & expressive',
      gender: 'female',
      preview: 'An enchanting voice that brings fairy tales to life',
      isPremium: true,
    },
    {
      id: 'onwK4e9ZLuTAKqWW03F9', // Daniel - British male
      name: 'Oliver',
      description: 'British storyteller',
      gender: 'male',
      preview: 'A distinguished British accent perfect for classic tales',
      isPremium: true,
    },
    {
      id: 'pFZP5JQG7iQjIQuC4Bku', // Lily - soft, dreamy female
      name: 'Starlight',
      description: 'Soft & dreamy',
      gender: 'female',
      preview: 'A whisper-soft voice ideal for sleepy bedtime stories',
      isPremium: true,
    },
    {
      id: 'yoZ06aMxZJJ28mfd3POQ', // Sam - warm male
      name: 'Grandpa Bear',
      description: 'Warm & cozy',
      gender: 'male',
      preview: 'A deep, comforting voice like a grandfather telling tales',
      isPremium: true,
    },
  ],
} as const;

export type VoiceId = typeof STORY_VOICES.free[number]['id'] | typeof STORY_VOICES.premium[number]['id'];

export interface VoiceConfig {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female';
  preview: string;
  isPremium: boolean;
}

// Get all available voices
export function getAllVoices(): VoiceConfig[] {
  return [...STORY_VOICES.free, ...STORY_VOICES.premium];
}

// Get voice by ID
export function getVoiceById(voiceId: string): VoiceConfig | undefined {
  return getAllVoices().find(v => v.id === voiceId);
}

// Check if a voice is premium
export function isVoicePremium(voiceId: string): boolean {
  const voice = getVoiceById(voiceId);
  return voice?.isPremium ?? false;
}

// Get default voice
export function getDefaultVoice(): VoiceConfig {
  return STORY_VOICES.free[0]; // Sarah
}

// Model to use for generation
export const ELEVENLABS_MODEL = 'eleven_multilingual_v2';

// Voice settings optimized for children's stories
export const STORY_VOICE_SETTINGS = {
  stability: 0.75, // Higher stability for consistent narration
  similarity_boost: 0.75,
  style: 0.5, // Some expressiveness
  use_speaker_boost: true,
};
