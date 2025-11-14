'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { StoryDisplay } from '@/components/story/story-display'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function StoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const [story, setStory] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStory() {
      if (!user || !params.id) return

      try {
        const response = await fetch(`/api/stories/${params.id}`)
        const data = await response.json()

        if (response.ok && data.story) {
          setStory({
            id: data.story.id,
            title: data.story.title,
            content: data.story.content,
            wordCount: data.story.word_count,
          })
        } else {
          router.push('/stories')
        }
      } catch (error) {
        console.error('Error loading story:', error)
        router.push('/stories')
      } finally {
        setLoading(false)
      }
    }

    loadStory()
  }, [user, params.id, router])

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
      <div className="mb-8">
        <Button
          onClick={() => router.push('/stories')}
          variant="outline"
          size="lg"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Stories
        </Button>
      </div>

      <StoryDisplay story={story} />
    </div>
  )
}
