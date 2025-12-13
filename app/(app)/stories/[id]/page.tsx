'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { StoryDisplay } from '@/components/story/story-display'
import { AudioPlayer } from '@/components/story/audio-player'
import { VoiceSelector } from '@/components/story/voice-selector'
import { StyleSelector } from '@/components/story/style-selector'
import { IllustrationGallery } from '@/components/story/illustration-gallery'
import { ArrowLeft, Loader2, Sparkles, Paintbrush, Mic, ImageIcon } from 'lucide-react'

interface Subscription {
  tier: string
  premiumVoicesUsed: number
  limits: {
    premiumVoicesPerMonth: number
  }
}

interface StoryImage {
  id: string
  scene_number: number
  scene_description: string
  public_url: string
}

export default function StoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const [story, setStory] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [storyImages, setStoryImages] = useState<StoryImage[]>([])

  // Audio generation state
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [audioJobId, setAudioJobId] = useState<string | null>(null)
  const [audioProgress, setAudioProgress] = useState<{ progress: number; message: string } | null>(null)

  // Image generation state
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null)
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [imageJobId, setImageJobId] = useState<string | null>(null)
  const [imageProgress, setImageProgress] = useState<{ progress: number; message: string } | null>(null)

  // Load story, subscription, and images
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
            hasIllustrations: storyData.story.has_illustrations,
            artStyle: storyData.story.art_style,
          })

          // Load images if story has illustrations
          if (storyData.story.has_illustrations) {
            loadStoryImages(storyData.story.id)
          }
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

  // Load story images
  const loadStoryImages = async (storyId: string) => {
    try {
      const response = await fetch(`/api/stories/${storyId}/images`)
      if (response.ok) {
        const data = await response.json()
        setStoryImages(data.images || [])
      }
    } catch (error) {
      console.error('Error loading story images:', error)
    }
  }

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

  // Poll for image generation status
  const pollImageStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get job status')
      }

      setImageProgress({
        progress: data.progress,
        message: data.message,
      })

      if (data.status === 'completed') {
        // Reload story and images
        setStory((prev: any) => ({
          ...prev,
          hasIllustrations: true,
        }))
        loadStoryImages(story.id)

        setIsGeneratingImages(false)
        setImageJobId(null)
        setImageProgress(null)
      } else if (data.status === 'failed') {
        console.error('Image generation failed:', data.errorMessage)
        setIsGeneratingImages(false)
        setImageJobId(null)
        setImageProgress(null)
      }

      return data
    } catch (err) {
      console.error('Error polling image status:', err)
      return null
    }
  }, [story?.id])

  // Set up polling for audio
  useEffect(() => {
    if (!audioJobId) return

    const poll = async () => {
      const status = await pollAudioStatus(audioJobId)
      if (status?.status === 'completed' || status?.status === 'failed') {
        return
      }
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [audioJobId, pollAudioStatus])

  // Set up polling for images
  useEffect(() => {
    if (!imageJobId) return

    const poll = async () => {
      const status = await pollImageStatus(imageJobId)
      if (status?.status === 'completed' || status?.status === 'failed') {
        return
      }
    }

    poll()
    const interval = setInterval(poll, 3000) // Poll less frequently for images
    return () => clearInterval(interval)
  }, [imageJobId, pollImageStatus])

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
          setStory((prev: any) => ({ ...prev, audioUrl: data.audioUrl }))
          setIsGeneratingAudio(false)
          return
        }
        throw new Error(data.error || 'Failed to start audio generation')
      }

      setAudioJobId(data.jobId)
      setAudioProgress({ progress: 0, message: data.message })
    } catch (err: any) {
      console.error('Error generating audio:', err)
      setIsGeneratingAudio(false)
    }
  }

  const handleGenerateImages = async (styleId: string, count: number) => {
    setIsGeneratingImages(true)
    setSelectedStyleId(styleId)

    try {
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: story.id,
          style: styleId,
          count,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.images && data.images.length > 0) {
          // Images already exist
          setStoryImages(data.images)
          setStory((prev: any) => ({ ...prev, hasIllustrations: true }))
          setIsGeneratingImages(false)
          return
        }
        throw new Error(data.error || 'Failed to start image generation')
      }

      setImageJobId(data.jobId)
      setImageProgress({ progress: 0, message: data.message })
    } catch (err: any) {
      console.error('Error generating images:', err)
      setIsGeneratingImages(false)
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

  const canDownload = hasPremiumAccess ?? false

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="Amari"
            width={120}
            height={40}
            className="h-10 w-auto mx-auto mb-4 animate-pulse"
          />
          <p className="text-amari-muted">Loading story...</p>
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
          <AudioPlayer
            audioUrl={story.audioUrl}
            title={story.title}
            canDownload={canDownload}
            onDownload={handleDownloadAudio}
          />
        ) : isGeneratingAudio ? (
          <div className="bg-amari-sage/10 rounded-2xl p-6 border-2 border-amari-sage/30">
            <div className="text-center">
              <div className="inline-flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-amari-sage/20 animate-ping opacity-25" />
                  <div className="relative p-3 bg-white rounded-full shadow-lg">
                    <Loader2 className="h-8 w-8 text-amari-sage animate-spin" />
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-display font-semibold text-amari-charcoal mb-2">
                Creating Audio Narration
              </h3>
              <p className="text-amari-muted mb-4">
                {audioProgress?.message || 'Preparing your story...'}
              </p>
              <div className="max-w-xs mx-auto">
                <div className="flex justify-between text-xs text-amari-muted mb-1">
                  <span>Progress</span>
                  <span>{audioProgress?.progress || 0}%</span>
                </div>
                <div className="h-2 bg-amari-sand rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amari-sage to-amari-terracotta rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(audioProgress?.progress || 0, 5)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amari-sage/10 rounded-2xl p-6 border-2 border-amari-sage/30 text-center">
            <Mic className="h-10 w-10 text-amari-sage mx-auto mb-3" />
            <h3 className="text-lg font-display font-semibold text-amari-charcoal mb-2">
              Bring This Story to Life
            </h3>
            <p className="text-amari-muted mb-4">
              Choose a narrator to hear your story read aloud with premium voices
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

      {/* Illustration Section */}
      <div className="mb-8">
        {storyImages.length > 0 ? (
          <IllustrationGallery
            images={storyImages}
            storyTitle={story.title}
            canDownload={canDownload}
          />
        ) : isGeneratingImages ? (
          <div className="bg-amari-rose/20 rounded-2xl p-6 border-2 border-amari-rose/30">
            <div className="text-center">
              <div className="inline-flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-amari-rose/20 animate-ping opacity-25" />
                  <div className="relative p-3 bg-white rounded-full shadow-lg">
                    <Loader2 className="h-8 w-8 text-amari-terracotta animate-spin" />
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-display font-semibold text-amari-charcoal mb-2">
                Creating Illustrations
              </h3>
              <p className="text-amari-muted mb-4">
                {imageProgress?.message || 'Preparing to illustrate your story...'}
              </p>
              <div className="max-w-xs mx-auto">
                <div className="flex justify-between text-xs text-amari-muted mb-1">
                  <span>Progress</span>
                  <span>{imageProgress?.progress || 0}%</span>
                </div>
                <div className="h-2 bg-amari-sand rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amari-terracotta to-amari-rose rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(imageProgress?.progress || 0, 5)}%` }}
                  />
                </div>
              </div>
              <p className="mt-4 text-xs text-amari-muted italic">
                This may take a few minutes - each illustration is uniquely generated
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amari-rose/20 rounded-2xl p-6 border-2 border-amari-rose/30 text-center">
            <ImageIcon className="h-10 w-10 text-amari-terracotta mx-auto mb-3" />
            <h3 className="text-lg font-display font-semibold text-amari-charcoal mb-2">
              Add Beautiful Illustrations
            </h3>
            <p className="text-amari-muted mb-4">
              Generate AI artwork to accompany your story
            </p>
            <StyleSelector
              selectedStyleId={selectedStyleId}
              onSelectStyle={setSelectedStyleId}
              onGenerateImages={handleGenerateImages}
              isGenerating={isGeneratingImages}
            />
          </div>
        )}
      </div>

      <StoryDisplay story={story} />
    </div>
  )
}
