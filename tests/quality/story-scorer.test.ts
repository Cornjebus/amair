import { describe, it, expect } from '@jest/globals';
import { scoreStoryQuality, getQualityGrade } from '@/lib/quality/story-scorer';

describe('Story Quality Scorer', () => {
  describe('Name Usage Scoring', () => {
    it('should give full points when requested names appear frequently', () => {
      const story = `Once upon a time, there was a girl named Amari. Amari loved to explore the forest. One day, Amari met a friendly dragon. The dragon and Amari became best friends. Amari visited the dragon every day.`;

      const result = scoreStoryQuality(story, {
        storyRequest: 'A story about a girl named Amari who meets a dragon',
        ageGroup: '5-7',
        targetLength: 'quick',
      });

      expect(result.breakdown.nameUsage).toBeGreaterThanOrEqual(25);
      expect(result.issues.filter(i => i.includes('name')).length).toBe(0);
    });

    it('should penalize when requested names are missing', () => {
      const story = `Once upon a time, there was a girl who loved adventures. She went to the forest and found a treasure.`;

      const result = scoreStoryQuality(story, {
        storyRequest: 'A story about Amari finding treasure',
        ageGroup: '5-7',
        targetLength: 'quick',
      });

      expect(result.breakdown.nameUsage).toBeLessThan(20);
      expect(result.issues.some(i => i.includes('Amari'))).toBe(true);
    });

    it('should give full points when no names are requested', () => {
      const story = `Once upon a time, there was a brave knight who saved the kingdom.`;

      const result = scoreStoryQuality(story, {
        storyRequest: 'A story about a brave knight',
        ageGroup: '5-7',
        targetLength: 'quick',
      });

      expect(result.breakdown.nameUsage).toBe(30);
    });
  });

  describe('Length Compliance Scoring', () => {
    it('should give full points for quick stories in range (300-400 words)', () => {
      const words = Array(350).fill('word').join(' ');

      const result = scoreStoryQuality(words, {
        storyRequest: 'A short story',
        ageGroup: '5-7',
        targetLength: 'quick',
      });

      expect(result.breakdown.lengthCompliance).toBeGreaterThanOrEqual(18);
    });

    it('should give full points for medium stories in range (600-800 words)', () => {
      const words = Array(700).fill('word').join(' ');

      const result = scoreStoryQuality(words, {
        storyRequest: 'A medium story',
        ageGroup: '5-7',
        targetLength: 'medium',
      });

      expect(result.breakdown.lengthCompliance).toBeGreaterThanOrEqual(18);
    });

    it('should give full points for epic stories in range (1000-1200 words)', () => {
      const words = Array(1100).fill('word').join(' ');

      const result = scoreStoryQuality(words, {
        storyRequest: 'A long story',
        ageGroup: '5-7',
        targetLength: 'epic',
      });

      expect(result.breakdown.lengthCompliance).toBeGreaterThanOrEqual(18);
    });

    it('should penalize stories that are too short', () => {
      const words = Array(150).fill('word').join(' ');

      const result = scoreStoryQuality(words, {
        storyRequest: 'A story',
        ageGroup: '5-7',
        targetLength: 'quick',
      });

      expect(result.breakdown.lengthCompliance).toBeLessThan(15);
      expect(result.issues.some(i => i.includes('too short'))).toBe(true);
    });

    it('should penalize stories that are too long', () => {
      const words = Array(600).fill('word').join(' ');

      const result = scoreStoryQuality(words, {
        storyRequest: 'A story',
        ageGroup: '5-7',
        targetLength: 'quick',
      });

      expect(result.breakdown.lengthCompliance).toBeLessThan(15);
      expect(result.issues.some(i => i.includes('too long'))).toBe(true);
    });
  });

  describe('Age Appropriateness Scoring', () => {
    it('should give full points for simple vocabulary (age 2-4)', () => {
      const story = `The cat ran. The dog ran too. They played in the sun. It was fun. The cat said meow. The dog said woof.`;

      const result = scoreStoryQuality(story, {
        storyRequest: 'A story about a cat and dog',
        ageGroup: '2-4',
        targetLength: 'quick',
      });

      expect(result.breakdown.ageAppropriate).toBeGreaterThanOrEqual(15);
    });

    it('should penalize complex vocabulary for young ages', () => {
      const story = `The magnificent feline demonstrated extraordinary capabilities. The sophisticated canine exhibited remarkable intelligence and unprecedented determination.`;

      const result = scoreStoryQuality(story, {
        storyRequest: 'A story about animals',
        ageGroup: '2-4',
        targetLength: 'quick',
      });

      expect(result.breakdown.ageAppropriate).toBeLessThan(15);
      expect(result.issues.some(i => i.includes('complex'))).toBe(true);
    });

    it('should allow richer vocabulary for older ages (8-10)', () => {
      const story = `The magnificent dragon soared through the crystalline sky, its iridescent scales shimmering brilliantly. The courageous adventurer demonstrated remarkable bravery and exceptional wisdom.`;

      const result = scoreStoryQuality(story, {
        storyRequest: 'A dragon adventure',
        ageGroup: '8-10',
        targetLength: 'quick',
      });

      expect(result.breakdown.ageAppropriate).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Repetition Scoring', () => {
    it('should give full points for no excessive repetition', () => {
      const story = `Once upon a time, there was a clever girl. She loved to explore. One day, she found a magical garden. The garden was full of wonders. She had an amazing adventure.`;

      const result = scoreStoryQuality(story, {
        storyRequest: 'An adventure story',
        ageGroup: '5-7',
        targetLength: 'quick',
      });

      expect(result.breakdown.noRepetition).toBeGreaterThanOrEqual(12);
    });

    it('should penalize repeated sentences', () => {
      const story = `Once upon a time, there was a girl. Once upon a time, there was a girl. She loved adventures. She loved adventures. The end.`;

      const result = scoreStoryQuality(story, {
        storyRequest: 'A story',
        ageGroup: '5-7',
        targetLength: 'quick',
      });

      expect(result.breakdown.noRepetition).toBeLessThan(12);
      expect(result.issues.some(i => i.includes('repeated'))).toBe(true);
    });
  });

  describe('Structure Scoring', () => {
    it('should give full points for well-structured stories', () => {
      const story = `Once upon a time, there lived a brave girl named Luna. Luna loved exploring the enchanted forest. One day, she discovered a hidden treasure. From that day on, Luna lived happily ever after.`;

      const result = scoreStoryQuality(story, {
        storyRequest: 'A story about Luna',
        ageGroup: '5-7',
        targetLength: 'quick',
      });

      expect(result.breakdown.structure).toBe(15);
      expect(result.issues.filter(i => i.includes('beginning') || i.includes('ending')).length).toBe(0);
    });

    it('should penalize stories without clear structure', () => {
      const story = `There was a person. They did things. Some stuff happened. That is all.`;

      const result = scoreStoryQuality(story, {
        storyRequest: 'A story',
        ageGroup: '5-7',
        targetLength: 'quick',
      });

      expect(result.breakdown.structure).toBeLessThan(15);
    });
  });

  describe('Overall Quality Score', () => {
    it('should pass high-quality stories (score >= 60)', () => {
      const story = `Once upon a time, in a cozy cottage by the sea, there lived a clever girl named Amari. Amari loved exploring tide pools and collecting seashells. One sunny morning, Amari discovered a mysterious bottle with a map inside. The map showed the way to a hidden treasure cave. Amari followed the map through the sandy dunes and rocky cliffs. When she reached the cave, she found not gold or jewels, but something even better - a family of friendly dolphins who became her forever friends. From that day on, Amari visited her dolphin friends every day, and they had wonderful adventures together. And they all lived happily ever after.`.repeat(4);

      const result = scoreStoryQuality(story, {
        storyRequest: 'A story about Amari finding treasure by the sea',
        ageGroup: '5-7',
        targetLength: 'medium',
      });

      expect(result.total).toBeGreaterThanOrEqual(60);
      expect(result.passed).toBe(true);
    });

    it('should fail low-quality stories (score < 60)', () => {
      const story = `There was a person. They did something. The end.`;

      const result = scoreStoryQuality(story, {
        storyRequest: 'A story about Amari',
        ageGroup: '5-7',
        targetLength: 'quick',
      });

      expect(result.total).toBeLessThan(60);
      expect(result.passed).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Quality Grade System', () => {
    it('should assign A+ grade for excellent stories (90+)', () => {
      const grade = getQualityGrade(95);
      expect(grade.grade).toBe('A+');
      expect(grade.description).toContain('Excellent');
    });

    it('should assign A grade for very good stories (80-89)', () => {
      const grade = getQualityGrade(85);
      expect(grade.grade).toBe('A');
      expect(grade.description).toContain('Very good');
    });

    it('should assign B grade for good stories (70-79)', () => {
      const grade = getQualityGrade(75);
      expect(grade.grade).toBe('B');
      expect(grade.description).toContain('Good');
    });

    it('should assign C grade for acceptable stories (60-69)', () => {
      const grade = getQualityGrade(65);
      expect(grade.grade).toBe('C');
      expect(grade.description).toContain('Acceptable');
    });

    it('should assign D grade for poor stories (50-59)', () => {
      const grade = getQualityGrade(55);
      expect(grade.grade).toBe('D');
      expect(grade.description).toContain('Poor');
    });

    it('should assign F grade for failed stories (<50)', () => {
      const grade = getQualityGrade(40);
      expect(grade.grade).toBe('F');
      expect(grade.description).toContain('Failed');
    });
  });

  describe('Real-World Story Examples', () => {
    it('should score a well-crafted bedtime story highly', () => {
      const story = `Once upon a time, in a magical garden behind her house, there lived a curious girl named Amari. Amari had sparkling brown eyes and loved butterflies more than anything in the world.

One peaceful evening, as the sun painted the sky orange and pink, Amari noticed a glowing butterfly she had never seen before. Its wings shimmered with all the colors of the rainbow.

"Hello, little one," Amari whispered softly.

To her surprise, the butterfly spoke! "Hello, Amari. My name is Luna. Would you like to see where I live?"

Amari nodded excitedly. Luna flew deeper into the garden, past the rose bushes and beneath the old oak tree. There, hidden behind curtains of hanging moss, was a tiny door carved into the tree trunk.

Luna touched the door with her delicate wing, and it swung open to reveal a world of wonder. Thousands of butterflies danced in the air, creating patterns of light and color. Soft music filled the air - the gentle humming of butterfly wings.

"This is beautiful," Amari gasped, her eyes wide with wonder.

Luna smiled. "We've been waiting to share this with someone kind and gentle. You are our special friend, Amari."

They spent the evening dancing with the butterflies, learning their songs, and making wishes on flower petals. When the moon rose high, Luna gently flew Amari back home.

"Will I see you again?" Amari asked.

"Every time you visit the garden with a kind heart," Luna promised.

That night, Amari fell asleep with a peaceful smile, dreaming of rainbow wings and magical friends. And from that day on, whenever she needed comfort or joy, she would visit her butterfly friends in the magical garden.

The end.`;

      const result = scoreStoryQuality(story, {
        storyRequest: 'A story about my daughter Amari who loves butterflies. She has a magical garden behind our house.',
        ageGroup: '5-7',
        targetLength: 'medium',
      });

      expect(result.breakdown.nameUsage).toBeGreaterThanOrEqual(25);
      expect(result.breakdown.lengthCompliance).toBeGreaterThanOrEqual(14);
      expect(result.breakdown.ageAppropriate).toBeGreaterThanOrEqual(15);
      expect(result.breakdown.structure).toBe(15);
      expect(result.total).toBeGreaterThanOrEqual(75);
      expect(result.passed).toBe(true);
    });
  });
});
