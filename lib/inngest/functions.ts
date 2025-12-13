import { inngest } from './client';
import { supabaseAdmin } from '@/lib/supabase/server';
import OpenAI from 'openai';

// Initialize OpenAI client
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Helper functions for prompts
const getLengthInstructions = (length: string): string => {
  const instructions: Record<string, string> = {
    quick: 'Keep the story brief and engaging, about 300-400 words. Perfect for a quick bedtime story.',
    medium: 'Create a medium-length story of about 600-800 words with a clear beginning, middle, and end.',
    epic: 'Craft a longer, more detailed story of about 1200-1500 words with rich descriptions and character development.',
  };
  return instructions[length] || instructions.medium;
};

const getToneInstructions = (tone: string): string => {
  const instructions: Record<string, string> = {
    'bedtime-calm': 'Use gentle, soothing language. The story should be warm and comforting, perfect for helping children wind down for sleep. Include peaceful imagery and a cozy atmosphere. End with everyone safe and ready for sleep.',
    'funny': 'Make the story humorous and playful with silly situations, funny dialogue, and light-hearted moments that will make children giggle. Keep it family-friendly and joyful.',
    'adventure': 'Create an exciting adventure with challenges to overcome, new places to explore, and brave characters. Include action and discovery while keeping it age-appropriate.',
    'mystery': 'Build a gentle mystery with clues to discover and a puzzle to solve. Keep it intriguing but not scary, suitable for young children.',
  };
  return instructions[tone] || instructions['bedtime-calm'];
};

interface ChildData {
  name: string;
  gender: 'boy' | 'girl' | 'other';
  items: string[];
}

interface StoryParams {
  children: ChildData[];
  config: {
    tone: string;
    length: string;
    originalInput?: string; // The user's original natural language request
  };
}

// =============================================================================
// Story Generation Background Job
// =============================================================================
export const generateStoryJob = inngest.createFunction(
  {
    id: 'generate-story',
    name: 'Generate Story',
    retries: 2,
    onFailure: async ({ error, event }) => {
      // Update job status to failed (cast to any until types are regenerated)
      const jobId = (event.data as any)?.jobId;
      if (jobId) {
        await (supabaseAdmin as any)
          .from('generation_jobs')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId);
      }
    },
  },
  { event: 'story/generate.requested' },
  async ({ event, step }) => {
    const { jobId, userId, storyParams } = event.data;
    const { children, config } = storyParams as StoryParams;

    // Step 1: Update status to generating
    await step.run('update-status-generating', async () => {
      await (supabaseAdmin as any)
        .from('generation_jobs')
        .update({
          status: 'generating',
          progress: 10,
          message: 'Creating your magical story...',
        })
        .eq('id', jobId);
    });

    // Step 2: Build the prompt
    const prompt = await step.run('build-prompt', async () => {
      let p = '';

      // If we have the original natural language input, use it as primary context
      if (config.originalInput) {
        p += `The parent requested: "${config.originalInput}"\n\n`;
        p += `Create a personalized ${config.tone} bedtime story based on this request.\n\n`;
      } else {
        p += `Create a ${config.tone} bedtime story with the following elements:\n\n`;
      }

      p += `Main Character(s):\n`;
      children.forEach((child) => {
        const pronouns = child.gender === 'girl' ? 'she/her' : child.gender === 'boy' ? 'he/him' : 'they/them';
        p += `- ${child.name} (${pronouns})`;
        if (child.items && child.items.length > 0) {
          p += ` - Include these elements: ${child.items.join(', ')}`;
        }
        p += '\n';
      });

      p += `\n${getToneInstructions(config.tone)}\n`;
      p += `${getLengthInstructions(config.length)}\n\n`;

      p += `IMPORTANT - Personalization Requirements:\n`;
      p += `- Make ${children.map((c) => c.name).join(' and ')} the HERO of the story - use their name frequently\n`;
      p += `- Include ALL specific details mentioned (pet names, favorite things, places, etc.) as key story elements\n`;
      p += `- Use the correct pronouns for each character\n`;
      p += `- Make the child feel special and brave in the story\n`;
      p += `- Include vivid, age-appropriate descriptions and dialogue\n`;
      p += `- Create a satisfying, heartwarming conclusion\n\n`;

      p += `Please provide:\n1. A creative, personalized title that includes the child's name\n2. The complete story`;
      return p;
    });

    // Step 3: Update progress
    await step.run('update-progress-30', async () => {
      await (supabaseAdmin as any)
        .from('generation_jobs')
        .update({
          progress: 30,
          message: 'Weaving the narrative...',
        })
        .eq('id', jobId);
    });

    // Step 4: Generate story with OpenAI GPT-5 mini
    const storyResponse = await step.run('generate-with-openai', async () => {
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: 'You are Amari, a magical bedtime storyteller who creates warm, imaginative, and family-friendly stories for children. Your stories are creative, engaging, and always include all the elements requested. You personalize each story with the specific details provided about the child.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_completion_tokens: 3000,
      });

      return completion.choices[0].message.content || '';
    });

    // Step 5: Update progress
    await step.run('update-progress-70', async () => {
      await (supabaseAdmin as any)
        .from('generation_jobs')
        .update({
          progress: 70,
          message: 'Adding finishing touches...',
        })
        .eq('id', jobId);
    });

    // Step 6: Parse and save story
    const story = await step.run('save-story', async () => {
      // Parse title and content
      const lines = storyResponse.split('\n');
      let title = 'A Magical Story';
      let content = storyResponse;

      if (lines[0].toLowerCase().startsWith('title:')) {
        title = lines[0].replace(/^title:\s*/i, '').trim();
        content = lines.slice(1).join('\n').trim();
      } else if (lines[0].startsWith('#')) {
        title = lines[0].replace(/^#+\s*/, '').trim();
        content = lines.slice(1).join('\n').trim();
      }

      const wordCount = content.split(/\s+/).length;

      // Save story to database (cast length to proper enum type)
      const storyTone = config.tone as 'bedtime-calm' | 'funny' | 'adventure' | 'mystery';
      const storyLength = config.length as 'quick' | 'medium' | 'epic';

      const { data: savedStory, error } = await supabaseAdmin
        .from('stories')
        .insert({
          user_id: userId,
          title,
          content,
          tone: storyTone,
          length: storyLength,
          word_count: wordCount,
        })
        .select()
        .single();

      if (error) throw error;

      // Save story seeds
      for (const child of children) {
        await supabaseAdmin.from('story_seeds').insert({
          story_id: savedStory.id,
          child_name: child.name,
          seed_items: child.items,
        });
      }

      return savedStory;
    });

    // Step 7: Track usage
    await step.run('track-usage', async () => {
      // Insert usage record
      const { error: usageError } = await (supabaseAdmin as any).from('usage_records').insert({
        user_id: userId,
        action_type: 'story_generation',
        metadata: {
          story_id: story.id,
          tone: config.tone,
          length: config.length,
        },
      });

      if (usageError) {
        console.error('Error inserting usage record:', usageError);
      }

      // Use the database function to record story generation
      // This handles incrementing usage properly
      const { data: usageResult, error: rpcError } = await (supabaseAdmin as any)
        .rpc('record_story_generation', {
          p_user_id: userId,
          p_used_premium_voice: false,
        });

      if (rpcError) {
        console.error('Error from record_story_generation RPC:', rpcError);

        // Fallback: Direct increment on user_subscriptions
        // First get current value
        const { data: currentSub } = await (supabaseAdmin as any)
          .from('user_subscriptions')
          .select('stories_used')
          .eq('user_id', userId)
          .single();

        if (currentSub) {
          const { error: updateError } = await (supabaseAdmin as any)
            .from('user_subscriptions')
            .update({
              stories_used: (currentSub.stories_used || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (updateError) {
            console.error('Fallback update also failed:', updateError);
          } else {
            console.log('Fallback increment succeeded, new count:', (currentSub.stories_used || 0) + 1);
          }
        }
      } else {
        console.log('Story generation recorded via RPC:', usageResult);
      }
    });

    // Step 8: Mark job complete
    await step.run('mark-complete', async () => {
      await (supabaseAdmin as any)
        .from('generation_jobs')
        .update({
          status: 'completed',
          progress: 100,
          message: 'Your story is ready!',
          result_id: story.id,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    });

    return {
      success: true,
      storyId: story.id,
      title: story.title,
    };
  }
);

// =============================================================================
// Monthly Usage Reset Job (Cron)
// =============================================================================
export const monthlyUsageReset = inngest.createFunction(
  {
    id: 'monthly-usage-reset',
    name: 'Monthly Usage Reset',
  },
  { cron: '0 0 * * *' }, // Run daily at midnight to check for period resets
  async ({ step }) => {
    // Find subscriptions that need reset (period ended)
    const subscriptionsToReset = await step.run('find-subscriptions', async () => {
      const { data } = await (supabaseAdmin as any)
        .from('user_subscriptions')
        .select('id, user_id, current_period_end')
        .lt('current_period_end', new Date().toISOString())
        .eq('status', 'active');

      return data || [];
    });

    // Reset each subscription's usage
    for (const sub of subscriptionsToReset) {
      await step.run(`reset-${sub.id}`, async () => {
        const newPeriodStart = new Date();
        const newPeriodEnd = new Date();
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

        await (supabaseAdmin as any)
          .from('user_subscriptions')
          .update({
            stories_used: 0,
            premium_voices_used: 0,
            current_period_start: newPeriodStart.toISOString(),
            current_period_end: newPeriodEnd.toISOString(),
          })
          .eq('id', sub.id);
      });
    }

    return { reset: subscriptionsToReset.length };
  }
);

// =============================================================================
// Audio Generation Job with ElevenLabs
// =============================================================================
export const generateAudioJob = inngest.createFunction(
  {
    id: 'generate-audio',
    name: 'Generate Audio Narration',
    retries: 2,
    onFailure: async ({ error, event }) => {
      const jobId = (event.data as any)?.jobId;
      if (jobId) {
        await (supabaseAdmin as any)
          .from('generation_jobs')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId);
      }
    },
  },
  { event: 'audio/generate.requested' },
  async ({ event, step }) => {
    const { jobId, storyId, userId, voiceId, isPremiumVoice } = event.data;

    // Step 1: Update status to generating
    await step.run('update-status-generating', async () => {
      await (supabaseAdmin as any)
        .from('generation_jobs')
        .update({
          status: 'generating',
          progress: 10,
          message: 'Preparing your story narration...',
        })
        .eq('id', jobId);
    });

    // Step 2: Fetch story content
    const story = await step.run('fetch-story', async () => {
      const { data, error } = await supabaseAdmin
        .from('stories')
        .select('id, title, content')
        .eq('id', storyId)
        .single();

      if (error || !data) {
        throw new Error('Story not found');
      }

      return data;
    });

    // Step 3: Update progress
    await step.run('update-progress-30', async () => {
      await (supabaseAdmin as any)
        .from('generation_jobs')
        .update({
          progress: 30,
          message: 'Generating audio narration...',
        })
        .eq('id', jobId);
    });

    // Step 4: Generate audio with ElevenLabs
    const audioResult = await step.run('generate-audio-elevenlabs', async () => {
      // Dynamic import to avoid issues with edge runtime
      const { getElevenLabsClient, getDefaultVoice, ELEVENLABS_MODEL, STORY_VOICE_SETTINGS } = await import('@/lib/elevenlabs/client');

      const client = getElevenLabsClient();
      const selectedVoiceId = voiceId || getDefaultVoice().id;

      // Prepare text - add title as intro
      const fullText = `${story.title}.\n\n${story.content}`;

      // Generate audio - returns a readable stream
      const audioResponse = await client.textToSpeech.convert(selectedVoiceId, {
        text: fullText,
        modelId: ELEVENLABS_MODEL,
        voiceSettings: STORY_VOICE_SETTINGS,
      });

      // Convert ReadableStream to Buffer
      const reader = (audioResponse as any).getReader?.()
        ?? (audioResponse as ReadableStream<Uint8Array>).getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }

      const audioBuffer = Buffer.concat(chunks);

      // Upload to Supabase Storage
      const fileName = `${userId}/${storyId}/narration-${Date.now()}.mp3`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('story-audio')
        .upload(fileName, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading audio:', uploadError);
        throw new Error('Failed to upload audio file');
      }

      // Get public URL
      const { data: publicUrlData } = supabaseAdmin.storage
        .from('story-audio')
        .getPublicUrl(fileName);

      return {
        filePath: fileName,
        publicUrl: publicUrlData.publicUrl,
        durationEstimate: Math.ceil(fullText.split(' ').length / 150), // Rough estimate: 150 words/min
      };
    });

    // Step 5: Update progress
    await step.run('update-progress-70', async () => {
      await (supabaseAdmin as any)
        .from('generation_jobs')
        .update({
          progress: 70,
          message: 'Saving your audio...',
        })
        .eq('id', jobId);
    });

    // Step 6: Save audio record to database
    const audioRecord = await step.run('save-audio-record', async () => {
      const { data, error } = await (supabaseAdmin as any)
        .from('story_audio')
        .insert({
          story_id: storyId,
          user_id: userId,
          voice_id: voiceId || 'default',
          file_path: audioResult.filePath,
          public_url: audioResult.publicUrl,
          duration_seconds: audioResult.durationEstimate * 60,
          is_premium_voice: isPremiumVoice || false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving audio record:', error);
        throw new Error('Failed to save audio record');
      }

      return data;
    });

    // Step 7: Track premium voice usage if applicable
    if (isPremiumVoice) {
      await step.run('track-premium-voice', async () => {
        // Insert usage record
        await (supabaseAdmin as any).from('usage_records').insert({
          user_id: userId,
          action_type: 'premium_voice_used',
          metadata: {
            story_id: storyId,
            audio_id: audioRecord.id,
            voice_id: voiceId,
          },
        });

        // Increment premium_voices_used
        const { data: currentSub } = await (supabaseAdmin as any)
          .from('user_subscriptions')
          .select('premium_voices_used')
          .eq('user_id', userId)
          .single();

        if (currentSub) {
          await (supabaseAdmin as any)
            .from('user_subscriptions')
            .update({
              premium_voices_used: (currentSub.premium_voices_used || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
        }
      });
    }

    // Step 8: Update story with audio reference
    await step.run('update-story-audio', async () => {
      await supabaseAdmin
        .from('stories')
        .update({ audio_url: audioResult.publicUrl })
        .eq('id', storyId);
    });

    // Step 9: Mark job complete
    await step.run('mark-complete', async () => {
      await (supabaseAdmin as any)
        .from('generation_jobs')
        .update({
          status: 'completed',
          progress: 100,
          message: 'Your audio narration is ready!',
          result_id: audioRecord.id,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    });

    return {
      success: true,
      audioId: audioRecord.id,
      publicUrl: audioResult.publicUrl,
    };
  }
);

// =============================================================================
// Image Generation Job with DALL-E 3
// =============================================================================
export const generateImagesJob = inngest.createFunction(
  {
    id: 'generate-images',
    name: 'Generate Story Illustrations',
    retries: 1, // Images are expensive, limit retries
    onFailure: async ({ error, event }) => {
      const jobId = (event.data as any)?.jobId;
      if (jobId) {
        await (supabaseAdmin as any)
          .from('generation_jobs')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId);
      }
    },
  },
  { event: 'images/generate.requested' },
  async ({ event, step }) => {
    const { jobId, storyId, userId, style, count } = event.data;
    const numberOfImages = count || 3;
    const artStyle = style || 'watercolor';

    // Step 1: Update status to generating
    await step.run('update-status-generating', async () => {
      await (supabaseAdmin as any)
        .from('generation_jobs')
        .update({
          status: 'generating',
          progress: 5,
          message: 'Preparing to create illustrations...',
        })
        .eq('id', jobId);
    });

    // Step 2: Fetch story content
    const story = await step.run('fetch-story', async () => {
      const { data, error } = await supabaseAdmin
        .from('stories')
        .select('id, title, content')
        .eq('id', storyId)
        .single();

      if (error || !data) {
        throw new Error('Story not found');
      }

      return data;
    });

    // Step 3: Extract scenes for illustration
    const scenes = await step.run('extract-scenes', async () => {
      const { extractScenesForIllustration } = await import('@/lib/ai/image-generator');

      await (supabaseAdmin as any)
        .from('generation_jobs')
        .update({
          progress: 15,
          message: 'Identifying key scenes to illustrate...',
        })
        .eq('id', jobId);

      return extractScenesForIllustration(story.content, story.title, numberOfImages);
    });

    // Step 4: Generate images one by one
    const generatedImages: Array<{ sceneNumber: number; publicUrl: string; id: string }> = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const sceneNumber = i + 1;
      const progressPercent = 20 + Math.floor((i / scenes.length) * 60);

      // Update progress
      await step.run(`update-progress-scene-${sceneNumber}`, async () => {
        await (supabaseAdmin as any)
          .from('generation_jobs')
          .update({
            progress: progressPercent,
            message: `Creating illustration ${sceneNumber} of ${scenes.length}...`,
          })
          .eq('id', jobId);
      });

      // Generate the image
      const imageResult = await step.run(`generate-image-${sceneNumber}`, async () => {
        const { generateStoryImage, downloadImageAsBuffer, ART_STYLES } = await import('@/lib/ai/image-generator');

        // Generate image with DALL-E
        const result = await generateStoryImage({
          prompt: scene,
          style: artStyle as any,
          storyTitle: story.title,
        });

        // Download image and upload to Supabase Storage
        const imageBuffer = await downloadImageAsBuffer(result.imageUrl);
        const fileName = `${userId}/${storyId}/scene-${sceneNumber}-${Date.now()}.png`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('story-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw new Error('Failed to upload image');
        }

        // Get public URL
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('story-images')
          .getPublicUrl(fileName);

        // Save to database (user_id derived from story via FK)
        const { data: savedImage, error: saveError } = await (supabaseAdmin as any)
          .from('story_images')
          .insert({
            story_id: storyId,
            scene_number: sceneNumber,
            scene_description: scene,
            prompt_used: result.revisedPrompt || scene,
            image_url: result.imageUrl,
            file_path: fileName,
            public_url: publicUrlData.publicUrl,
            style: artStyle,
            model: result.model,
          })
          .select()
          .single();

        if (saveError) {
          console.error('Error saving image record:', saveError);
          throw new Error('Failed to save image record');
        }

        return {
          id: savedImage.id,
          publicUrl: publicUrlData.publicUrl,
          sceneNumber,
        };
      });

      generatedImages.push(imageResult);
    }

    // Step 5: Update story with illustration info
    await step.run('update-story-illustrations', async () => {
      await (supabaseAdmin as any)
        .from('stories')
        .update({
          has_illustrations: true,
          illustration_count: generatedImages.length,
          art_style: artStyle,
        })
        .eq('id', storyId);
    });

    // Step 6: Mark job complete
    await step.run('mark-complete', async () => {
      await (supabaseAdmin as any)
        .from('generation_jobs')
        .update({
          status: 'completed',
          progress: 100,
          message: `Created ${generatedImages.length} beautiful illustrations!`,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    });

    return {
      success: true,
      imageCount: generatedImages.length,
      images: generatedImages,
    };
  }
);
