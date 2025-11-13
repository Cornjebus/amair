import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Moon, Heart, BookOpen, Zap, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-lavender-200 bg-white/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-lavender-400 to-skyblue-400 rounded-full flex items-center justify-center butterfly-glow">
              <span className="text-2xl">🦋</span>
            </div>
            <span className="font-playfair text-2xl font-bold text-lavender-900">
              Amari
            </span>
          </div>

          <nav className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-lavender-400 to-skyblue-400 rounded-full flex items-center justify-center butterfly-glow animate-flutter">
              <span className="text-6xl">🦋</span>
            </div>
          </div>

          <h1 className="text-6xl md:text-7xl font-playfair font-bold text-lavender-900 mb-6">
            Every bedtime becomes a butterfly of imagination
          </h1>

          <p className="text-xl text-lavender-700 mb-12 max-w-2xl mx-auto">
            Create magical, personalized bedtime stories with your children.
            Simply pick random things together, and watch Amari weave them into
            an enchanting tale.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Creating Stories <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-playfair font-bold text-center text-lavender-900 mb-16">
          How Amari Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-lavender-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-lavender-600" />
              </div>
              <h3 className="text-xl font-playfair font-semibold mb-3 text-lavender-900">
                1. Pick Random Things
              </h3>
              <p className="text-lavender-700">
                Each child chooses 1-5 random objects, animals, places, or feelings to include in the story.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-skyblue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Moon className="h-8 w-8 text-skyblue-600" />
              </div>
              <h3 className="text-xl font-playfair font-semibold mb-3 text-lavender-900">
                2. Choose Your Style
              </h3>
              <p className="text-lavender-700">
                Select the tone (calm, funny, adventure, or mystery) and length (quick, medium, or epic).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-cream-600" />
              </div>
              <h3 className="text-xl font-playfair font-semibold mb-3 text-lavender-900">
                3. Enjoy the Magic
              </h3>
              <p className="text-lavender-700">
                Amari creates a unique, personalized story featuring all your chosen elements. Listen or read together!
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-br from-lavender-50 to-skyblue-50 rounded-3xl">
        <h2 className="text-4xl font-playfair font-bold text-center text-lavender-900 mb-16">
          Why Families Love Amari
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <Heart className="h-12 w-12 text-lavender-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-lavender-900">Bond Together</h3>
            <p className="text-lavender-700">
              Create special moments with your children through collaborative storytelling.
            </p>
          </div>

          <div className="text-center">
            <Zap className="h-12 w-12 text-skyblue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-lavender-900">Spark Creativity</h3>
            <p className="text-lavender-700">
              Encourage imagination as children see their ideas come to life in stories.
            </p>
          </div>

          <div className="text-center">
            <Shield className="h-12 w-12 text-cream-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-lavender-900">Always Safe</h3>
            <p className="text-lavender-700">
              Every story is family-friendly, age-appropriate, and perfect for bedtime.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-playfair font-bold text-lavender-900 mb-6">
            Ready to Create Your First Story?
          </h2>
          <p className="text-xl text-lavender-700 mb-8">
            Join thousands of families making bedtime magical with Amari
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Free Trial <Sparkles className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-lavender-200 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-lavender-600">
          <p>&copy; 2024 Amari. Every bedtime becomes a butterfly of imagination.</p>
        </div>
      </footer>
    </div>
  )
}
