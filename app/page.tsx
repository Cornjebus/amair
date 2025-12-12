import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Moon, Heart, BookOpen, Zap, Shield, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-amari-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-amari-sand bg-amari-cream/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.svg"
              alt="Amari"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          <nav className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-semibold text-amari-charcoal mb-6 leading-tight">
            Bedtime stories as unique as your child
          </h1>

          <p className="text-xl text-amari-muted mb-10 max-w-2xl mx-auto leading-relaxed">
            Create magical, personalized stories together. Pick a few favorite things,
            and watch Amari weave them into an enchanting bedtime adventure.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="text-base px-8 w-full sm:w-auto">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-base px-8 w-full sm:w-auto">
                View Plans
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-amari-muted">
            14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-amari-charcoal mb-4">
            How Amari Works
          </h2>
          <p className="text-amari-muted max-w-xl mx-auto">
            Three simple steps to create a one-of-a-kind bedtime story
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-8 pb-6">
              <div className="w-14 h-14 bg-amari-terracotta/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Sparkles className="h-7 w-7 text-amari-terracotta" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3 text-amari-charcoal">
                1. Pick favorite things
              </h3>
              <p className="text-amari-muted">
                Your child chooses objects, animals, places, or feelings to include in their story.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-8 pb-6">
              <div className="w-14 h-14 bg-amari-sage/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Moon className="h-7 w-7 text-amari-sage" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3 text-amari-charcoal">
                2. Choose the mood
              </h3>
              <p className="text-amari-muted">
                Select calm, funny, adventure, or mystery. Pick quick, medium, or epic length.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-8 pb-6">
              <div className="w-14 h-14 bg-amari-rose/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <BookOpen className="h-7 w-7 text-amari-terracotta" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3 text-amari-charcoal">
                3. Enjoy the magic
              </h3>
              <p className="text-amari-muted">
                Amari creates a unique, illustrated story with optional narration. Read or listen together!
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-amari-charcoal mb-4">
              Why Families Love Amari
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-amari-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 text-amari-terracotta" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-2 text-amari-charcoal">
                Bond Together
              </h3>
              <p className="text-amari-muted text-sm">
                Create special moments through collaborative storytelling that your children will remember.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-amari-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-amari-sage" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-2 text-amari-charcoal">
                Spark Creativity
              </h3>
              <p className="text-amari-muted text-sm">
                Watch imagination flourish as children see their ideas come to life in every story.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-amari-rose/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-amari-charcoal" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-2 text-amari-charcoal">
                Always Safe
              </h3>
              <p className="text-amari-muted text-sm">
                Every story is family-friendly, age-appropriate, and perfect for peaceful bedtimes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-amari-charcoal mb-4">
            Ready for magical bedtimes?
          </h2>
          <p className="text-lg text-amari-muted mb-8">
            Join thousands of families creating personalized stories together.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="text-base px-8">
              Start Your Free Trial
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amari-sand py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Image
              src="/logo.svg"
              alt="Amari"
              width={80}
              height={28}
              className="h-6 w-auto opacity-70"
            />
          </div>
          <p className="text-sm text-amari-muted">
            &copy; {new Date().getFullYear()} Amari. Bedtime stories as unique as your child.
          </p>
        </div>
      </footer>
    </div>
  )
}
