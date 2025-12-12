'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Search, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function StoriesPage() {
  const { user } = useUser()
  const [stories, setStories] = useState<any[]>([])
  const [filteredStories, setFilteredStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTone, setFilterTone] = useState<string>('all')

  useEffect(() => {
    async function loadStories() {
      if (!user) return

      try {
        const response = await fetch('/api/stories')
        const data = await response.json()

        if (response.ok) {
          setStories(data.stories || [])
          setFilteredStories(data.stories || [])
        } else {
          console.error('Error loading stories:', data.error)
        }
      } catch (error) {
        console.error('Error loading stories:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStories()
  }, [user])

  useEffect(() => {
    let filtered = stories

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by tone
    if (filterTone !== 'all') {
      filtered = filtered.filter(story => story.tone === filterTone)
    }

    setFilteredStories(filtered)
  }, [searchQuery, filterTone, stories])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Image
            src="/logo.svg"
            alt="Amari"
            width={120}
            height={40}
            className="h-10 w-auto mx-auto mb-4 animate-pulse"
          />
          <p className="text-amari-muted">Loading your stories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-semibold text-amari-charcoal mb-2">
            My Stories
          </h1>
          <p className="text-lg text-amari-muted">
            {stories.length} magical {stories.length === 1 ? 'story' : 'stories'} created
          </p>
        </div>
        <Link href="/create">
          <Button size="lg">
            <Sparkles className="mr-2 h-5 w-5" />
            Create New Story
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      {stories.length > 0 && (
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amari-muted" />
            <Input
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterTone === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterTone('all')}
            >
              All
            </Button>
            <Button
              variant={filterTone === 'bedtime-calm' ? 'default' : 'outline'}
              onClick={() => setFilterTone('bedtime-calm')}
            >
              🌙 Calm
            </Button>
            <Button
              variant={filterTone === 'funny' ? 'default' : 'outline'}
              onClick={() => setFilterTone('funny')}
            >
              😄 Funny
            </Button>
            <Button
              variant={filterTone === 'adventure' ? 'default' : 'outline'}
              onClick={() => setFilterTone('adventure')}
            >
              🗺️ Adventure
            </Button>
            <Button
              variant={filterTone === 'mystery' ? 'default' : 'outline'}
              onClick={() => setFilterTone('mystery')}
            >
              🔍 Mystery
            </Button>
          </div>
        </div>
      )}

      {/* Stories Grid */}
      {filteredStories.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <Link key={story.id} href={`/stories/${story.id}`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl">
                      {story.tone === 'bedtime-calm' ? '🌙' : story.tone === 'funny' ? '😄' : story.tone === 'adventure' ? '🗺️' : '🔍'}
                    </span>
                    <div className="text-right">
                      <div className="text-xs text-amari-muted">
                        {new Date(story.created_at).toLocaleDateString()}
                      </div>
                      {story.is_favorite && <span className="text-lg">❤️</span>}
                    </div>
                  </div>
                  <CardTitle className="text-xl line-clamp-2 text-amari-charcoal">
                    {story.title}
                  </CardTitle>
                  <CardDescription className="text-amari-muted">
                    {story.word_count} words • {Math.ceil(story.word_count / 150)} min read
                  </CardDescription>
                  <div className="pt-4 text-sm text-amari-muted line-clamp-3">
                    {story.content.substring(0, 150)}...
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : stories.length > 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-display font-semibold text-amari-charcoal mb-2">
              No Stories Found
            </h3>
            <p className="text-amari-muted">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-display font-semibold text-amari-charcoal mb-2">
              No Stories Yet
            </h3>
            <p className="text-amari-muted mb-6">
              Create your first magical bedtime story!
            </p>
            <Link href="/create">
              <Button size="lg">
                Create Your First Story <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
