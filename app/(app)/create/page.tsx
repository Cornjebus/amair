'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Loader2, Wand2, Moon, Laugh, Compass, Search, BookOpen } from 'lucide-react'
import { StoryDisplay } from '@/components/story/story-display'

// Story options
const toneOptions = [
  { value: 'bedtime-calm', label: 'Bedtime Calm', icon: Moon, description: 'Gentle and soothing for sleep' },
  { value: 'funny', label: 'Funny', icon: Laugh, description: 'Silly and playful laughs' },
  { value: 'adventure', label: 'Adventure', icon: Compass, description: 'Exciting and brave' },
  { value: 'mystery', label: 'Mystery', icon: Search, description: 'Curious and intriguing' },
]

const ageOptions = [
  { value: '2-4', label: '2-4 years', description: 'Simple words, short sentences' },
  { value: '5-7', label: '5-7 years', description: 'More detail, fun vocabulary' },
  { value: '8-10', label: '8-10 years', description: 'Rich stories, complex plots' },
]

const lengthOptions = [
  { value: 'quick', label: 'Quick', description: '2-3 minutes' },
  { value: 'medium', label: 'Medium', description: '5 minutes' },
  { value: 'epic', label: 'Epic', description: '10 minutes' },
]

const styleOptions = [
  { value: 'classic', label: 'Classic Fairytale', description: 'Once upon a time...' },
  { value: 'modern', label: 'Modern Adventure', description: 'Contemporary setting' },
  { value: 'fantasy', label: 'Fantasy World', description: 'Magic and wonder' },
  { value: 'animal', label: 'Animal Friends', description: 'Talking animals' },
]

const suggestionChips = [
  'A story about my daughter Amari and her brother Cornelius finding a magic garden',
  'My son Jake discovers a friendly dragon in his backyard',
  'A bedtime adventure for Emma and her cat Whiskers',
  'Twins Max and Lily find a treasure map',
  'A story about Sofia who can talk to butterflies',
]

export default function CreateStoryPage() {
  const router = useRouter()

  // Form state
  const [storyRequest, setStoryRequest] = useState('')
  const [tone, setTone] = useState('bedtime-calm')
  const [ageGroup, setAgeGroup] = useState('5-7')
  const [length, setLength] = useState('medium')
  const [style, setStyle] = useState('classic')

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedStory, setGeneratedStory] = useState<any>(null)

  const canGenerate = storyRequest.trim().length >= 10

  const handleGenerate = async () => {
    if (!canGenerate) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyRequest: storyRequest.trim(),
          tone,
          ageGroup,
          length,
          style,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate story')
      }

      setGeneratedStory(data.story)
    } catch (err: any) {
      console.error('Error generating story:', err)
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateAnother = () => {
    setGeneratedStory(null)
    setStoryRequest('')
    setError(null)
  }

  // Show the generated story
  if (generatedStory) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <Button onClick={handleCreateAnother} variant="outline" size="lg">
            <Sparkles className="mr-2 h-5 w-5" />
            Create Another Story
          </Button>
          <Button onClick={() => router.push('/stories')} variant="outline" size="lg">
            <BookOpen className="mr-2 h-5 w-5" />
            My Stories
          </Button>
        </div>
        <StoryDisplay story={generatedStory} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-amari-terracotta/10 rounded-full mb-4">
          <Wand2 className="h-8 w-8 text-amari-terracotta" />
        </div>
        <h1 className="text-3xl font-display font-semibold text-amari-charcoal mb-2">
          Create a Magical Story
        </h1>
        <p className="text-amari-muted">
          Describe your story and we'll bring it to life
        </p>
      </div>

      {/* Main Form */}
      <div className="space-y-6">
        {/* Story Request Input */}
        <div className="space-y-3">
          <Label className="text-lg font-medium text-amari-charcoal">
            What story would you like?
          </Label>
          <textarea
            value={storyRequest}
            onChange={(e) => setStoryRequest(e.target.value)}
            placeholder="A bedtime story about my daughter Amari and her brother Cornelius who discover a magical garden..."
            className="w-full px-4 py-4 text-lg border-2 border-amari-sand rounded-2xl focus:border-amari-terracotta focus:ring-2 focus:ring-amari-terracotta/20 focus:outline-none min-h-[140px] resize-none bg-white"
          />
          <p className="text-sm text-amari-muted">
            Include names, characters, themes, and any special details you want in the story
          </p>
        </div>

        {/* Suggestion Chips */}
        <div className="space-y-2">
          <p className="text-sm text-amari-muted">Try one of these:</p>
          <div className="flex flex-wrap gap-2">
            {suggestionChips.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setStoryRequest(suggestion)}
                className="px-3 py-1.5 text-sm bg-amari-sand/50 border border-amari-sand rounded-full text-amari-charcoal hover:bg-amari-terracotta/10 hover:border-amari-terracotta/30 transition-all"
              >
                {suggestion.length > 50 ? suggestion.substring(0, 50) + '...' : suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Options Grid */}
        <div className="bg-amari-cream/50 rounded-2xl p-6 border border-amari-sand">
          <h3 className="font-medium text-amari-charcoal mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amari-sage" />
            Story Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tone */}
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Age Group */}
            <div className="space-y-2">
              <Label>Age Group</Label>
              <Select value={ageGroup} onValueChange={setAgeGroup}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Length */}
            <div className="space-y-2">
              <Label>Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lengthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span>{option.label} ({option.description})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Style */}
            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !canGenerate}
          className="w-full h-14 text-lg"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Creating Your Story...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-6 w-6" />
              Generate Story
            </>
          )}
        </Button>

        {!canGenerate && storyRequest.length > 0 && (
          <p className="text-center text-amari-muted text-sm">
            Please add more details (at least 10 characters)
          </p>
        )}
      </div>
    </div>
  )
}
