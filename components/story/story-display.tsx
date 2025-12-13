'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Volume2, Download, Heart, Share2, ChevronLeft, ChevronRight, Play, Pause, Mic } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface StoryPage {
  pageNumber: number
  text: string
  imageUrl?: string
  imagePrompt?: string
}

interface StoryDisplayProps {
  story: {
    id: string
    title: string
    content?: string
    pages?: StoryPage[]
    wordCount?: number
    audioUrl?: string
    audioDuration?: number
  }
  onSave?: () => void
  onShare?: () => void
  showAudioPrompt?: boolean
}

export function StoryDisplay({ story, onSave, onShare, showAudioPrompt = true }: StoryDisplayProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Get content from either pages or direct content
  const storyContent = story.pages
    ? story.pages.map(p => p.text).join('\n\n')
    : story.content || ''
  const pages = story.pages || []
  const hasPages = pages.length > 0
  const wordCount = story.wordCount || storyContent.split(/\s+/).length

  // Handle premium audio playback
  useEffect(() => {
    if (story.audioUrl && audioRef.current) {
      audioRef.current.onended = () => {
        setIsPlayingAudio(false)
      }
    }
  }, [story.audioUrl])

  const toggleAudio = () => {
    // Only play if we have premium audio
    if (story.audioUrl && audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause()
        setIsPlayingAudio(false)
      } else {
        audioRef.current.play()
        setIsPlayingAudio(true)
      }
    }
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob(
      [`${story.title}\n\n${storyContent}`],
      { type: 'text/plain' }
    )
    element.href = URL.createObjectURL(file)
    element.download = `${story.title.replace(/[^a-z0-9]/gi, '_')}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Hidden audio element for premium narration */}
      {story.audioUrl && (
        <audio ref={audioRef} src={story.audioUrl} preload="auto" />
      )}

      <Card className="relative overflow-hidden">
        <CardHeader className="text-center pb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-4xl mb-4 text-amari-charcoal font-display">
              {story.title}
            </CardTitle>
            <div className="flex items-center justify-center gap-4 text-sm text-amari-muted">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{Math.ceil(wordCount / 150)} min read</span>
              {story.audioDuration && (
                <>
                  <span>•</span>
                  <span>{Math.floor(story.audioDuration / 60)}:{String(story.audioDuration % 60).padStart(2, '0')} audio</span>
                </>
              )}
              {hasPages && (
                <>
                  <span>•</span>
                  <span>{pages.length} pages</span>
                </>
              )}
            </div>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Audio Player or Prompt */}
          {story.audioUrl ? (
            <div className="flex flex-wrap gap-3 justify-center pb-6 border-b border-amari-sand">
              <Button
                onClick={toggleAudio}
                variant={isPlayingAudio ? 'default' : 'secondary'}
                size="lg"
              >
                {isPlayingAudio ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    Stop Audio
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Play Audio
                  </>
                )}
              </Button>
              {onSave && (
                <Button onClick={onSave} variant="outline" size="lg">
                  <Heart className="mr-2 h-5 w-5" />
                  Save Story
                </Button>
              )}
              <Button onClick={handleDownload} variant="outline" size="lg">
                <Download className="mr-2 h-5 w-5" />
                Download
              </Button>
              {onShare && (
                <Button onClick={onShare} variant="outline" size="lg">
                  <Share2 className="mr-2 h-5 w-5" />
                  Share
                </Button>
              )}
            </div>
          ) : showAudioPrompt && story.id ? (
            <div className="mb-6 p-4 bg-amari-sage/10 border-2 border-amari-sage/30 rounded-2xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="p-2 bg-amari-sage/20 rounded-full">
                    <Mic className="h-5 w-5 text-amari-sage" />
                  </div>
                  <div>
                    <p className="font-medium text-amari-charcoal">Bring this story to life!</p>
                    <p className="text-sm text-amari-muted">Add premium AI narration with beautiful voices</p>
                  </div>
                </div>
                <Link href={`/stories/${story.id}`}>
                  <Button size="lg">
                    <Volume2 className="mr-2 h-5 w-5" />
                    Add Narration
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center pb-6 border-b border-amari-sand">
              {onSave && (
                <Button onClick={onSave} variant="outline" size="lg">
                  <Heart className="mr-2 h-5 w-5" />
                  Save Story
                </Button>
              )}
              <Button onClick={handleDownload} variant="outline" size="lg">
                <Download className="mr-2 h-5 w-5" />
                Download
              </Button>
              {onShare && (
                <Button onClick={onShare} variant="outline" size="lg">
                  <Share2 className="mr-2 h-5 w-5" />
                  Share
                </Button>
              )}
            </div>
          )}

          {/* Page-based display with illustrations */}
          {hasPages ? (
            <div className="space-y-6">
              {/* Current Page Illustration */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  {pages[currentPage]?.imageUrl && (
                    <div className="relative aspect-square md:aspect-video max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-xl mb-6">
                      <img
                        src={pages[currentPage].imageUrl}
                        alt={`Illustration for page ${currentPage + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Page Text */}
                  <div className="prose prose-lg max-w-none text-center">
                    <div className="text-amari-charcoal leading-relaxed font-serif text-xl">
                      {pages[currentPage]?.text}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Page Navigation */}
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  variant="outline"
                  size="lg"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Previous
                </Button>
                <span className="text-amari-muted font-medium tabular-nums">
                  Page {currentPage + 1} of {pages.length}
                </span>
                <Button
                  onClick={nextPage}
                  disabled={currentPage === pages.length - 1}
                  variant="outline"
                  size="lg"
                >
                  Next
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Page dots */}
              <div className="flex justify-center gap-2">
                {pages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      idx === currentPage
                        ? 'bg-amari-terracotta'
                        : 'bg-amari-sand hover:bg-amari-terracotta/50'
                    }`}
                    aria-label={`Go to page ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Simple content display (no pages) */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="prose prose-lg max-w-none"
            >
              <div className="text-amari-charcoal leading-relaxed font-serif whitespace-pre-wrap">
                {storyContent}
              </div>
            </motion.div>
          )}

          {/* Decorative ending */}
          {(!hasPages || currentPage === pages.length - 1) && (
            <div className="text-center pt-8 text-3xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
              >
                ✨ 🌙 ✨
              </motion.div>
              <p className="text-amari-muted text-sm mt-4 font-display">
                The End
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
