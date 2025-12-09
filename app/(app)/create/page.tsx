'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { StoryWizard } from '@/components/story/story-wizard'
import { StoryDisplay } from '@/components/story/story-display'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles, BookOpen, Wand2, Stars } from 'lucide-react'

interface ChildData {
  name: string
  itemCount: number
  items: string[]
}

interface StoryConfig {
  tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery'
  length: 'quick' | 'medium' | 'epic'
}

interface JobStatus {
  id: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  progress: number
  message: string
  story?: any
  errorMessage?: string
}

const progressMessages = [
  { icon: Wand2, text: 'Gathering magical ingredients...' },
  { icon: Sparkles, text: 'Sprinkling imagination dust...' },
  { icon: Stars, text: 'Weaving dreams together...' },
  { icon: BookOpen, text: 'Writing your adventure...' },
]

export default function CreateStoryPage() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedStory, setGeneratedStory] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [messageIndex, setMessageIndex] = useState(0)

  // Rotate through fun progress messages
  useEffect(() => {
    if (!isGenerating) return
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % progressMessages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [isGenerating])

  // Poll for job status
  const pollJobStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/jobs/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get job status')
      }

      setJobStatus(data)

      if (data.status === 'completed' && data.story) {
        setGeneratedStory(data.story)
        setIsGenerating(false)
        setJobId(null)
      } else if (data.status === 'failed') {
        setError(data.errorMessage || 'Story generation failed')
        setIsGenerating(false)
        setJobId(null)
      }

      return data
    } catch (err: any) {
      console.error('Error polling job status:', err)
      return null
    }
  }, [])

  // Set up polling when we have a job ID
  useEffect(() => {
    if (!jobId) return

    const poll = async () => {
      const status = await pollJobStatus(jobId)
      if (status?.status === 'completed' || status?.status === 'failed') {
        return // Stop polling
      }
    }

    // Initial poll
    poll()

    // Poll every 2 seconds
    const interval = setInterval(poll, 2000)

    return () => clearInterval(interval)
  }, [jobId, pollJobStatus])

  const handleGenerate = async (children: ChildData[], config: StoryConfig) => {
    setIsGenerating(true)
    setError(null)
    setJobStatus(null)
    setMessageIndex(0)

    try {
      // Use async endpoint
      const response = await fetch('/api/generate-story-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ children, config }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start story generation')
      }

      // Set job ID to start polling
      setJobId(data.jobId)
      setJobStatus({
        id: data.jobId,
        status: 'pending',
        progress: 0,
        message: data.message,
      })
    } catch (err: any) {
      console.error('Error generating story:', err)
      setError(err.message)
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    router.push('/stories')
  }

  const handleCreateAnother = () => {
    setGeneratedStory(null)
    setError(null)
    setJobId(null)
    setJobStatus(null)
  }

  const CurrentIcon = progressMessages[messageIndex].icon

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
              {(error.includes('limit') || error.includes('stories')) && (
                <p className="text-sm mt-2">
                  You've reached your monthly story limit.{' '}
                  <a href="/pricing" className="underline font-medium">
                    Upgrade your plan
                  </a>{' '}
                  to create more magical stories!
                </p>
              )}
            </div>
          )}

          {/* Progress UI */}
          {isGenerating && jobStatus && (
            <div className="mb-8 p-8 bg-gradient-to-br from-lavender-50 to-peach-50 border-2 border-lavender-200 rounded-3xl">
              <div className="text-center">
                {/* Animated Icon */}
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full bg-lavender-200 animate-ping opacity-25" />
                  <div className="relative p-4 bg-white rounded-full shadow-lg">
                    <CurrentIcon className="h-10 w-10 text-lavender-600 animate-pulse" />
                  </div>
                </div>

                {/* Progress Message */}
                <h3 className="text-2xl font-playfair font-semibold text-lavender-900 mb-2">
                  {progressMessages[messageIndex].text}
                </h3>
                <p className="text-lavender-600 mb-6">
                  {jobStatus.message || 'Creating something special...'}
                </p>

                {/* Progress Bar */}
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between text-sm text-lavender-600 mb-2">
                    <span>Progress</span>
                    <span>{jobStatus.progress}%</span>
                  </div>
                  <div className="h-3 bg-lavender-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-lavender-400 to-peach-400 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(jobStatus.progress, 5)}%` }}
                    />
                  </div>
                </div>

                {/* Fun fact while waiting */}
                <p className="mt-6 text-sm text-lavender-500 italic">
                  Did you know? Every story we create is unique, just like your little one!
                </p>
              </div>
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
