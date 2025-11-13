import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getReadingTime(wordCount: number): string {
  const wordsPerMinute = 150
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return `${minutes} min read`
}

export function getToneEmoji(tone: string): string {
  const emojiMap: Record<string, string> = {
    'bedtime-calm': '🌙',
    'funny': '😄',
    'adventure': '🗺️',
    'mystery': '🔍',
  }
  return emojiMap[tone] || '✨'
}

export function getLengthLabel(length: string): string {
  const labelMap: Record<string, string> = {
    'quick': '2-3 minutes',
    'medium': '5 minutes',
    'epic': '10 minutes',
  }
  return labelMap[length] || length
}
