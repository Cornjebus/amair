'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Loader2, Wand2, Moon, Laugh, Compass, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion } from 'framer-motion'

interface StoryRequest {
  storyDescription: string
  tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery'
  length: 'quick' | 'medium' | 'epic'
}

interface NaturalInputProps {
  onGenerate: (request: StoryRequest) => void
  isGenerating?: boolean
}

const toneOptions = [
  { value: 'bedtime-calm', label: 'Bedtime Calm', icon: Moon, description: 'Gentle and soothing' },
  { value: 'funny', label: 'Funny', icon: Laugh, description: 'Silly and playful' },
  { value: 'adventure', label: 'Adventure', icon: Compass, description: 'Exciting and brave' },
  { value: 'mystery', label: 'Mystery', icon: Search, description: 'Curious and intriguing' },
]

const lengthOptions = [
  { value: 'quick', label: 'Quick', description: '2-3 minutes' },
  { value: 'medium', label: 'Medium', description: '5 minutes' },
  { value: 'epic', label: 'Epic', description: '10 minutes' },
]

const suggestionChips = [
  'A bedtime story about Emma and a magical unicorn',
  'My son Jake and his pet dragon go on an adventure',
  'A mystery story for Lily in an enchanted forest',
  'A funny story about Max and his silly cat',
  'My daughter Sofia discovers a secret garden',
  'A story about twins who find a magic map',
]

const placeholderExamples = [
  'A bedtime story about my daughter Amari and her brother Cornelius...',
  'My son Jake wants a story about dinosaurs and rockets...',
  'A magical adventure for Emma with unicorns and rainbows...',
  'A funny story about my kids Max and Lily finding a treasure...',
]

export function NaturalInput({ onGenerate, isGenerating }: NaturalInputProps) {
  const [input, setInput] = useState('')
  const [tone, setTone] = useState<'bedtime-calm' | 'funny' | 'adventure' | 'mystery'>('bedtime-calm')
  const [length, setLength] = useState<'quick' | 'medium' | 'epic'>('medium')
  const [placeholder, setPlaceholder] = useState(placeholderExamples[0])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Rotate placeholder examples
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder(prev => {
        const currentIndex = placeholderExamples.indexOf(prev)
        return placeholderExamples[(currentIndex + 1) % placeholderExamples.length]
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleChipClick = (suggestion: string) => {
    setInput(suggestion)
    textareaRef.current?.focus()
  }

  const handleGenerate = () => {
    if (input.trim().length < 10) return
    onGenerate({
      storyDescription: input.trim(),
      tone,
      length,
    })
  }

  const canGenerate = input.trim().length >= 10

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Main Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="relative bg-white rounded-3xl shadow-lg border-2 border-amari-sand overflow-hidden focus-within:border-amari-terracotta focus-within:shadow-xl transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="w-full px-6 py-5 text-lg text-amari-charcoal placeholder-amari-muted bg-transparent resize-none focus:outline-none min-h-[120px]"
            rows={3}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-amari-sand/30 border-t border-amari-sand">
            <p className="text-sm text-amari-muted">
              Describe your story with names, characters, and themes
            </p>
            <span className="text-sm text-amari-muted">
              {input.length} characters
            </span>
          </div>
        </div>

        {/* Floating wand decoration */}
        <div className="absolute -top-3 -right-3 p-2 bg-gradient-to-br from-amari-terracotta to-amari-sage rounded-full shadow-lg">
          <Wand2 className="h-5 w-5 text-white" />
        </div>
      </motion.div>

      {/* Suggestion Chips */}
      <div className="space-y-2">
        <p className="text-sm text-amari-muted text-center">Try one of these:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {suggestionChips.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleChipClick(suggestion)}
              className="px-4 py-2 text-sm bg-white border border-amari-sand rounded-full text-amari-charcoal hover:bg-amari-sand/50 hover:border-amari-terracotta/50 transition-all hover:shadow-md"
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Story Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-amari-sage/10 rounded-2xl p-6 border-2 border-amari-sage/30"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-amari-sage" />
          <h3 className="font-semibold text-amari-charcoal">Story Settings</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Tone Selection */}
          <div className="space-y-2">
            <Label className="text-amari-charcoal">Story Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
              <SelectTrigger className="bg-white border-amari-sand">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-amari-sage" />
                        <span>{option.label}</span>
                        <span className="text-amari-muted text-xs">- {option.description}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Length Selection */}
          <div className="space-y-2">
            <Label className="text-amari-charcoal">Story Length</Label>
            <Select value={length} onValueChange={(v) => setLength(v as typeof length)}>
              <SelectTrigger className="bg-white border-amari-sand">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lengthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span>{option.label}</span>
                      <span className="text-amari-muted text-xs">({option.description})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !canGenerate}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating Magic...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Story
            </>
          )}
        </Button>

        {!canGenerate && input.length > 0 && (
          <p className="text-center text-amari-muted text-sm mt-2">
            Please add more details (at least 10 characters)
          </p>
        )}
      </motion.div>
    </div>
  )
}
