'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StoryWizard } from '@/components/story/story-wizard'
import { StoryDisplay } from '@/components/story/story-display'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface ChildData {
  name: string
  itemCount: number
  items: string[]
}

interface StoryConfig {
  tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery'
  length: 'quick' | 'medium' | 'epic'
}

export default function CreateStoryPage() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedStory, setGeneratedStory] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (children: ChildData[], config: StoryConfig) => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ children, config }),
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

  const handleSave = async () => {
    // Story is already saved in the backend
    router.push('/stories')
  }

  const handleCreateAnother = () => {
    setGeneratedStory(null)
    setError(null)
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      {!generatedStory ? (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-playfair font-bold text-lavender-900 mb-4">
              Create a Magical Story
            </h1>
            <p className="text-lg text-lavender-600">
              Let's weave imagination into a bedtime adventure
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700">
              <p className="font-medium">Error: {error}</p>
              {error.includes('limit reached') && (
                <p className="text-sm mt-2">
                  Free users can create 3 stories per month.{' '}
                  <a href="/pricing" className="underline">
                    Upgrade to premium
                  </a>{' '}
                  for unlimited stories!
                </p>
              )}
            </div>
          )}

          <StoryWizard onGenerate={handleGenerate} isGenerating={isGenerating} />
        </>
      ) : (
        <>
          <div className="mb-8 flex items-center justify-between">
            <Button
              onClick={handleCreateAnother}
              variant="outline"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Create Another Story
            </Button>
          </div>

          <StoryDisplay
            story={generatedStory}
            onSave={handleSave}
          />
        </>
      )}
    </div>
  )
}
