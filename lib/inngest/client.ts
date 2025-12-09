import { Inngest } from 'inngest';

// Create Inngest client
export const inngest = new Inngest({
  id: 'myamari',
  name: 'MyAmari',
  // Event key is automatically read from INNGEST_EVENT_KEY env var
  // Signing key is automatically read from INNGEST_SIGNING_KEY env var
});

// Event types for type safety
export type InngestEvents = {
  'story/generate.requested': {
    data: {
      jobId: string;
      userId: string;
      storyParams: {
        childName: string;
        childAge: number;
        theme: string;
        tone: string;
        includeLesson?: string;
        lengthPreference?: 'short' | 'medium' | 'long';
      };
    };
  };
  'story/generate.progress': {
    data: {
      jobId: string;
      status: 'generating' | 'completed' | 'failed';
      progress: number;
      message: string;
    };
  };
  'audio/generate.requested': {
    data: {
      jobId: string;
      storyId: string;
      userId: string;
      voiceId?: string;
    };
  };
  'images/generate.requested': {
    data: {
      jobId: string;
      storyId: string;
      userId: string;
      style?: string;
      count?: number;
    };
  };
  'subscription/usage.reset': {
    data: {
      userId: string;
    };
  };
  'email/send.requested': {
    data: {
      type: 'gift_code' | 'subscription_welcome' | 'story_ready';
      to: string;
      data: Record<string, any>;
    };
  };
};
