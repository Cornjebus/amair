'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Moon, Laugh, Compass, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ChildData {
  name: string
  itemCount: number
  items: string[]
}

interface StoryConfig {
  tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery'
  length: 'quick' | 'medium' | 'epic'
}

interface StoryWizardProps {
  onGenerate: (children: ChildData[], config: StoryConfig) => void
  isGenerating: boolean
}

const toneOptions = [
  { value: 'bedtime-calm', label: 'Bedtime Calm', icon: Moon, color: 'lavender' },
  { value: 'funny', label: 'Funny Adventure', icon: Laugh, color: 'skyblue' },
  { value: 'adventure', label: 'Epic Adventure', icon: Compass, color: 'cream' },
  { value: 'mystery', label: 'Mystery', icon: Search, color: 'lavender' },
]

const lengthOptions = [
  { value: 'quick', label: 'Quick (2-3 min)' },
  { value: 'medium', label: 'Medium (5 min)' },
  { value: 'epic', label: 'Epic (10 min)' },
]

export function StoryWizard({ onGenerate, isGenerating }: StoryWizardProps) {
  const [step, setStep] = useState(1)
  const [numChildren, setNumChildren] = useState(1)
  const [children, setChildren] = useState<ChildData[]>([])
  const [currentChild, setCurrentChild] = useState(0)
  const [config, setConfig] = useState<StoryConfig>({
    tone: 'bedtime-calm',
    length: 'medium',
  })

  const handleNumChildrenSubmit = () => {
    const childArray: ChildData[] = Array(numChildren).fill(null).map(() => ({
      name: '',
      itemCount: 3,
      items: [],
    }))
    setChildren(childArray)
    setStep(2)
  }

  const handleChildNameSubmit = () => {
    if (children[currentChild].name && children[currentChild].itemCount > 0) {
      setStep(3)
    }
  }

  const handleItemsSubmit = () => {
    const child = children[currentChild]
    if (child.items.length === child.itemCount) {
      if (currentChild < numChildren - 1) {
        setCurrentChild(currentChild + 1)
        setStep(2)
      } else {
        setStep(4)
      }
    }
  }

  const handleGenerate = () => {
    onGenerate(children, config)
  }

  const updateChild = (index: number, updates: Partial<ChildData>) => {
    const newChildren = [...children]
    newChildren[index] = { ...newChildren[index], ...updates }
    setChildren(newChildren)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-4xl animate-flutter">🦋</span>
                  Let's Create Magic
                </CardTitle>
                <CardDescription>
                  How many children are joining tonight's story?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="numChildren">Number of Children</Label>
                  <Select
                    value={numChildren.toString()}
                    onValueChange={(value) => setNumChildren(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'child' : 'children'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleNumChildrenSubmit}
                  className="w-full"
                  size="lg"
                >
                  Continue <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  Child {currentChild + 1} of {numChildren}
                </CardTitle>
                <CardDescription>
                  What's their name and how many special things will they add?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="childName">Child's Name</Label>
                  <Input
                    id="childName"
                    placeholder="Enter name..."
                    value={children[currentChild]?.name || ''}
                    onChange={(e) =>
                      updateChild(currentChild, { name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemCount">Number of Special Things (1-5)</Label>
                  <Select
                    value={children[currentChild]?.itemCount?.toString() || '3'}
                    onValueChange={(value) =>
                      updateChild(currentChild, {
                        itemCount: parseInt(value),
                        items: [],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'thing' : 'things'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleChildNameSubmit}
                  className="w-full"
                  size="lg"
                  disabled={!children[currentChild]?.name}
                >
                  Next <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{children[currentChild]?.name}'s Special Things</CardTitle>
                <CardDescription>
                  Add {children[currentChild]?.itemCount} random things for the story
                  (objects, animals, places, or feelings)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Array(children[currentChild]?.itemCount || 0)
                  .fill(null)
                  .map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Label htmlFor={`item-${index}`}>
                        Thing {index + 1}
                      </Label>
                      <Input
                        id={`item-${index}`}
                        placeholder="e.g., a blue dragon, the moon, happiness..."
                        value={children[currentChild]?.items[index] || ''}
                        onChange={(e) => {
                          const newItems = [...(children[currentChild]?.items || [])]
                          newItems[index] = e.target.value
                          updateChild(currentChild, { items: newItems })
                        }}
                      />
                    </div>
                  ))}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleItemsSubmit}
                    className="flex-1"
                    size="lg"
                    disabled={
                      children[currentChild]?.items.filter((i) => i.trim()).length !==
                      children[currentChild]?.itemCount
                    }
                  >
                    {currentChild < numChildren - 1 ? 'Next Child' : 'Choose Story Style'}{' '}
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Story Style</CardTitle>
                <CardDescription>
                  Choose the tone and length for tonight's story
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Story Tone</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {toneOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.value}
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              tone: option.value as any,
                            }))
                          }
                          className={`p-4 rounded-2xl border-2 transition-all ${
                            config.tone === option.value
                              ? 'border-lavender-500 bg-lavender-50 shadow-lg scale-105'
                              : 'border-lavender-200 bg-white hover:border-lavender-300'
                          }`}
                        >
                          <Icon className="h-6 w-6 mx-auto mb-2 text-lavender-600" />
                          <div className="text-sm font-medium">{option.label}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length">Story Length</Label>
                  <Select
                    value={config.length}
                    onValueChange={(value) =>
                      setConfig((prev) => ({
                        ...prev,
                        length: value as any,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lengthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentChild(numChildren - 1)
                      setStep(3)
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    className="flex-1"
                    size="lg"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="animate-pulse">Creating Magic...</span>
                      </>
                    ) : (
                      <>
                        Generate Story <Sparkles className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
