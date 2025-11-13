'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, Download, Heart, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface StoryDisplayProps {
  story: {
    id: string
    title: string
    content: string
    wordCount: number
  }
  onSave?: () => void
  onShare?: () => void
}

export function StoryDisplay({ story, onSave, onShare }: StoryDisplayProps) {
  const [isReading, setIsReading] = useState(false)
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const synth = window.speechSynthesis
      const u = new SpeechSynthesisUtterance(story.content)

      // Configure voice
      u.rate = 0.9 // Slightly slower for bedtime
      u.pitch = 1.0
      u.volume = 1.0

      // Try to use a pleasant voice
      const voices = synth.getVoices()
      const preferredVoice = voices.find(
        (voice) =>
          voice.name.includes('Female') ||
          voice.name.includes('Samantha') ||
          voice.name.includes('Karen')
      )
      if (preferredVoice) {
        u.voice = preferredVoice
      }

      u.onend = () => {
        setIsReading(false)
      }

      setUtterance(u)
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [story.content])

  const toggleReading = () => {
    if (!utterance) return

    if (isReading) {
      window.speechSynthesis.cancel()
      setIsReading(false)
    } else {
      window.speechSynthesis.speak(utterance)
      setIsReading(true)
    }
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob(
      [`${story.title}\n\n${story.content}`],
      { type: 'text/plain' }
    )
    element.href = URL.createObjectURL(file)
    element.download = `${story.title.replace(/[^a-z0-9]/gi, '_')}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="relative overflow-hidden">
        {/* Decorative butterflies */}
        <div className="absolute top-4 right-4 text-4xl animate-flutter opacity-50">
          🦋
        </div>
        <div className="absolute bottom-4 left-4 text-3xl animate-flutter opacity-30" style={{ animationDelay: '1s' }}>
          🦋
        </div>

        <CardHeader className="text-center pb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-4xl mb-4 text-lavender-900">
              {story.title}
            </CardTitle>
            <div className="flex items-center justify-center gap-4 text-sm text-lavender-600">
              <span>{story.wordCount} words</span>
              <span>•</span>
              <span>{Math.ceil(story.wordCount / 150)} min read</span>
            </div>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 justify-center pb-6 border-b border-lavender-200">
            <Button
              onClick={toggleReading}
              variant={isReading ? 'default' : 'secondary'}
              size="lg"
            >
              {isReading ? (
                <>
                  <VolumeX className="mr-2 h-5 w-5" />
                  Stop Reading
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-5 w-5" />
                  Read Aloud
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

          {/* Story content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="prose prose-lg max-w-none"
          >
            <div className="text-lavender-900 leading-relaxed font-serif whitespace-pre-wrap">
              {story.content}
            </div>
          </motion.div>

          {/* Decorative ending */}
          <div className="text-center pt-8 text-3xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
            >
              ✨ 🌙 ✨
            </motion.div>
            <p className="text-lavender-600 text-sm mt-4 font-playfair">
              The End
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
