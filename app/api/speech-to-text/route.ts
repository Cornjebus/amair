import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { captureError } from '@/lib/monitoring/sentry'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * POST /api/speech-to-text
 *
 * Transcribes audio using OpenAI Whisper API
 * Accepts audio file as FormData
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Whisper accepts: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm
    const validTypes = [
      'audio/flac',
      'audio/m4a',
      'audio/mp3',
      'audio/mp4',
      'audio/mpeg',
      'audio/mpga',
      'audio/oga',
      'audio/ogg',
      'audio/wav',
      'audio/webm',
      'audio/x-wav',
      'audio/wave',
    ]

    // Browser might send different MIME types, be lenient
    const isValidType = validTypes.some(type =>
      audioFile.type.includes(type.split('/')[1]) || audioFile.type === type
    )

    if (!isValidType && audioFile.type !== '') {
      console.warn(`Unexpected audio type: ${audioFile.type}, attempting anyway`)
    }

    // Convert File to the format OpenAI expects
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'json',
    })

    return NextResponse.json({
      text: transcription.text,
      success: true
    })
  } catch (error: any) {
    captureError(error, { action: 'speech_to_text' })
    console.error('Speech-to-text error:', error)

    // Handle specific OpenAI errors
    if (error?.status === 400) {
      return NextResponse.json(
        { error: 'Invalid audio format. Please try again.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}
