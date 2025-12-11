'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Sparkles, Loader2, Wand2, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface ParsedStoryRequest {
  childName: string
  childAge?: number
  gender?: 'boy' | 'girl' | 'other'
  theme: string
  tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery'
  length: 'quick' | 'medium' | 'epic'
  customElements: string[]
  suggestedCharacters?: Array<{ id: string; name: string }>
  confidence: number
  originalInput: string
}

interface NaturalInputProps {
  onParsed: (parsed: ParsedStoryRequest) => void
  onGenerate: (parsed: ParsedStoryRequest) => void
  isGenerating?: boolean
}

const suggestionChips = [
  'A bedtime story about Emma and a magical unicorn',
  'A funny adventure with dragons and dinosaurs',
  'A mystery story for Max in a spooky castle',
  'A calm story about friendly forest animals',
  'An epic adventure with pirates and treasure',
  'A story about my daughter and butterflies',
]

const placeholderExamples = [
  'Tell me a bedtime story about Lily and a magical garden...',
  'A funny adventure where Max meets a silly dragon...',
  'My daughter Emma wants a story about unicorns and rainbows...',
  'A mystery story for Jake in an enchanted forest...',
]

export function NaturalInput({ onParsed, onGenerate, isGenerating }: NaturalInputProps) {
  const [input, setInput] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedStoryRequest | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [placeholder, setPlaceholder] = useState(placeholderExamples[0])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

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

  // Parse input when it changes (debounced)
  useEffect(() => {
    if (input.length < 10) {
      setParsed(null)
      return
    }

    const timeout = setTimeout(async () => {
      setIsParsing(true)
      try {
        const response = await fetch('/api/parse-story-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input }),
        })

        if (response.ok) {
          const data = await response.json()
          setParsed(data.parsed)
          onParsed(data.parsed)
        }
      } catch (error) {
        console.error('Error parsing input:', error)
      } finally {
        setIsParsing(false)
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [input, onParsed])

  // Transcribe audio using Whisper API
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.text) {
          setInput(prev => prev ? `${prev} ${data.text}` : data.text)
        }
      } else {
        const error = await response.json()
        console.error('Transcription error:', error)
        alert('Failed to transcribe audio. Please try again.')
      }
    } catch (error) {
      console.error('Error transcribing audio:', error)
      alert('Failed to transcribe audio. Please try again.')
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Use webm format which Whisper supports well
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType })
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())

        // Transcribe the audio
        await transcribeAudio(audioBlob)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please ensure you have granted permission.')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleChipClick = (suggestion: string) => {
    setInput(suggestion)
    textareaRef.current?.focus()
  }

  const handleGenerate = () => {
    if (parsed) {
      onGenerate(parsed)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Main Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="relative bg-white rounded-3xl shadow-lg border-2 border-lavender-200 overflow-hidden focus-within:border-lavender-400 focus-within:shadow-xl transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="w-full px-6 py-5 text-lg text-lavender-900 placeholder-lavender-400 bg-transparent resize-none focus:outline-none min-h-[120px]"
            rows={3}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-lavender-50 border-t border-lavender-100">
            <div className="flex items-center gap-2">
              {/* Voice button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
                className={`rounded-full ${isRecording ? 'bg-red-100 text-red-600 hover:bg-red-200 animate-pulse' : 'hover:bg-lavender-100'}`}
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-1 animate-spin" />
                    <span className="text-sm">Transcribing...</span>
                  </>
                ) : isRecording ? (
                  <>
                    <Square className="h-5 w-5 mr-1" />
                    <span className="text-sm">Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5 mr-1" />
                    <span className="text-sm">Voice</span>
                  </>
                )}
              </Button>

              {/* Recording indicator */}
              {isRecording && (
                <div className="flex items-center text-red-500 text-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                  Recording...
                </div>
              )}

              {/* Parsing indicator */}
              {isParsing && !isRecording && (
                <div className="flex items-center text-lavender-500 text-sm">
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Parsing...
                </div>
              )}
            </div>

            {/* Character count */}
            <span className="text-sm text-lavender-400">
              {input.length} characters
            </span>
          </div>
        </div>

        {/* Floating wand decoration */}
        <div className="absolute -top-3 -right-3 p-2 bg-gradient-to-br from-lavender-400 to-peach-400 rounded-full shadow-lg">
          <Wand2 className="h-5 w-5 text-white" />
        </div>
      </motion.div>

      {/* Suggestion Chips */}
      <div className="space-y-2">
        <p className="text-sm text-lavender-500 text-center">Try one of these:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {suggestionChips.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleChipClick(suggestion)}
              className="px-4 py-2 text-sm bg-white border border-lavender-200 rounded-full text-lavender-700 hover:bg-lavender-50 hover:border-lavender-300 transition-all hover:shadow-md"
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Extraction Preview */}
      <AnimatePresence>
        {parsed && parsed.confidence > 0.3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-lavender-50 to-peach-50 rounded-2xl p-6 border-2 border-lavender-200"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-lavender-600" />
              <h3 className="font-semibold text-lavender-900">Story Preview</h3>
              <span className="ml-auto text-sm text-lavender-500">
                {Math.round(parsed.confidence * 100)}% confident
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-xs text-lavender-500 uppercase">Hero</span>
                <p className="font-medium text-lavender-900">{parsed.childName}</p>
              </div>
              <div>
                <span className="text-xs text-lavender-500 uppercase">Tone</span>
                <p className="font-medium text-lavender-900 capitalize">{parsed.tone.replace('-', ' ')}</p>
              </div>
              <div>
                <span className="text-xs text-lavender-500 uppercase">Length</span>
                <p className="font-medium text-lavender-900 capitalize">{parsed.length}</p>
              </div>
              <div>
                <span className="text-xs text-lavender-500 uppercase">Theme</span>
                <p className="font-medium text-lavender-900">{parsed.theme}</p>
              </div>
            </div>

            {parsed.customElements.length > 0 && (
              <div className="mb-4">
                <span className="text-xs text-lavender-500 uppercase">Magical Elements</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {parsed.customElements.map((element) => (
                    <span
                      key={element}
                      className="px-2 py-1 bg-white rounded-full text-sm text-lavender-700 border border-lavender-200"
                    >
                      {element}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parsed.suggestedCharacters && parsed.suggestedCharacters.length > 0 && (
              <div className="mb-4">
                <span className="text-xs text-lavender-500 uppercase">Matched Characters</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {parsed.suggestedCharacters.map((char) => (
                    <span
                      key={char.id}
                      className="px-2 py-1 bg-peach-100 rounded-full text-sm text-peach-700 border border-peach-200"
                    >
                      {char.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help text when no input */}
      {!input && (
        <p className="text-center text-lavender-400 text-sm">
          Just describe the story you want, and our AI will figure out the rest!
        </p>
      )}
    </div>
  )
}

