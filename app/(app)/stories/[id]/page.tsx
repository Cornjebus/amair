'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { StoryDisplay } from '@/components/story/story-display'
import { AudioPlayer } from '@/components/story/audio-player'
import { VoiceSelector } from '@/components/story/voice-selector'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'

interface Subscription {
  tier: string
  premiumVoicesUsed: number
  limits: {
    premiumVoicesPerMonth: number
  }
}

export default function StoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const [story, setStory] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  // Audio generation state
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [audioJobId, setAudioJobId] = useState<string | null>(null)
  const [audioProgress, setAudioProgress] = useState<{ progress: number; message: string } | null>(null)

  // Load story and subscription
  useEffect(() => {
    async function loadData() {
      if (!user || !params.id) return

      try {
        // Load story and subscription in parallel
        const [storyResponse, subResponse] = await Promise.all([
          fetch(`/api/stories/${params.id}`),
          fetch('/api/subscriptions'),
        ])

        const storyData = await storyResponse.json()
        const subData = await subResponse.json()

        if (storyResponse.ok && storyData.story) {
          setStory({
            id: storyData.story.id,
            title: storyData.story.title,
            content: storyData.story.content,
            pages: storyData.story.pages,
            wordCount: storyData.story.word_count,
            audioUrl: storyData.story.audio_url,
            audioDuration: storyData.story.audio_duration,
          })
        } else {
          router.push('/stories')
        }

        if (subResponse.ok) {
          setSubscription(subData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        router.push('/stories')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, params.id, router])

  // Poll for audio generation status
  const pollAudioStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get job status')
      }

      setAudioProgress({
        progress: data.progress,
        message: data.message,
      })

      if (data.status === 'completed') {
        // Reload story to get audio URL
        const storyResponse = await fetch(`/api/stories/${params.id}`)
        const storyData = await storyResponse.json()

        if (storyResponse.ok && storyData.story) {
          setStory((prev: any) => ({
            ...prev,
            audioUrl: storyData.story.audio_url,
          }))
        }

        setIsGeneratingAudio(false)
        setAudioJobId(null)
        setAudioProgress(null)
      } else if (data.status === 'failed') {
        console.error('Audio generation failed:', data.errorMessage)
        setIsGeneratingAudio(false)
        setAudioJobId(null)
        setAudioProgress(null)
      }

      return data
    } catch (err) {
      console.error('Error polling audio status:', err)
      return null
    }
  }, [params.id])

  // Set up polling when we have a job ID
  useEffect(() => {
    if (!audioJobId) return

    const poll = async () => {
      const status = await pollAudioStatus(audioJobId)
      if (status?.status === 'completed' || status?.status === 'failed') {
        return // Stop polling
      }
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [audioJobId, pollAudioStatus])

  const handleGenerateAudio = async (voiceId: string) => {
    setIsGeneratingAudio(true)
    setSelectedVoiceId(voiceId)

    try {
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: story.id,
          voiceId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.audioUrl) {
          // Audio already exists
          setStory((prev: any) => ({ ...prev, audioUrl: data.audioUrl }))
          setIsGeneratingAudio(false)
          return
        }
        throw new Error(data.error || 'Failed to start audio generation')
      }

      // Start polling
      setAudioJobId(data.jobId)
      setAudioProgress({ progress: 0, message: data.message })
    } catch (err: any) {
      console.error('Error generating audio:', err)
      setIsGeneratingAudio(false)
    }
  }

  const handleDownloadAudio = () => {
    if (story.audioUrl) {
      const link = document.createElement('a')
      link.href = story.audioUrl
      link.download = `${story.title.replace(/[^a-z0-9]/gi, '_')}.mp3`
      link.click()
    }
  }

  const hasPremiumAccess = subscription && subscription.tier !== 'free'
  const premiumVoicesRemaining = subscription
    ? Math.max(0, subscription.limits.premiumVoicesPerMonth - subscription.premiumVoicesUsed)
    : 0

  // Can download if user has a paid tier with download feature
  const canDownload = hasPremiumAccess ?? false

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-lavender-400 to-skyblue-400 rounded-full flex items-center justify-center butterfly-glow animate-flutter mx-auto mb-4">
            <span className="text-4xl">🦋</span>
          </div>
          <p className="text-lavender-600">Loading story...</p>
        </div>
      </div>
    )
  }

  if (!story) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <Button
          onClick={() => router.push('/stories')}
          variant="outline"
          size="lg"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Stories
        </Button>
      </div>

      {/* Audio Section */}
      <div className="mb-8">
        {story.audioUrl ? (
          /* Audio Player - story has audio */
          <AudioPlayer
            audioUrl={story.audioUrl}
            title={story.title}
            canDownload={canDownload}
            onDownload={handleDownloadAudio}
          />
        ) : isGeneratingAudio ? (
          /* Audio Generation Progress */
          <div className="bg-gradient-to-r from-lavender-50 to-peach-50 rounded-2xl p-6 border-2 border-lavender-200">
            <div className="text-center">
              <div className="inline-flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-lavender-200 animate-ping opacity-25" />
                  <div className="relative p-3 bg-white rounded-full shadow-lg">
                    <Loader2 className="h-8 w-8 text-lavender-600 animate-spin" />
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-lavender-900 mb-2">
                Creating Audio Narration
              </h3>
              <p className="text-lavender-600 mb-4">
                {audioProgress?.message || 'Preparing your story...'}
              </p>
              <div className="max-w-xs mx-auto">
                <div className="flex justify-between text-xs text-lavender-500 mb-1">
                  <span>Progress</span>
                  <span>{audioProgress?.progress || 0}%</span>
                </div>
                <div className="h-2 bg-lavender-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-lavender-400 to-peach-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(audioProgress?.progress || 0, 5)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Voice Selector - no audio yet */
          <div className="bg-gradient-to-r from-lavender-50 to-peach-50 rounded-2xl p-6 border-2 border-lavender-200 text-center">
            <Sparkles className="h-10 w-10 text-lavender-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-lavender-900 mb-2">
              Bring This Story to Life
            </h3>
            <p className="text-lavender-600 mb-4">
              Choose a narrator to hear your story read aloud
            </p>
            <VoiceSelector
              selectedVoiceId={selectedVoiceId}
              onSelectVoice={setSelectedVoiceId}
              onGenerateAudio={handleGenerateAudio}
              isGenerating={isGeneratingAudio}
              premiumVoicesRemaining={premiumVoicesRemaining}
              hasPremiumAccess={hasPremiumAccess || false}
            />
          </div>
        )}
      </div>

      <StoryDisplay story={story} />
    </div>
  )
}
