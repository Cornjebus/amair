'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
  value: number[]
  max?: number
  step?: number
  onValueChange?: (value: number[]) => void
  disabled?: boolean
  className?: string
}

export function Slider({
  value,
  max = 100,
  step = 1,
  onValueChange,
  disabled = false,
  className,
}: SliderProps) {
  const percentage = ((value[0] || 0) / max) * 100

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    onValueChange?.([newValue])
  }

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative h-2 w-full rounded-full bg-amari-sand">
        <div
          className="absolute h-full rounded-full bg-amari-terracotta transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        value={value[0] || 0}
        max={max}
        step={step}
        onChange={handleChange}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
    </div>
  )
}
