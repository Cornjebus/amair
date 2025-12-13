import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/logo.png"
              alt="Amari"
              width={180}
              height={60}
              className="h-14 w-auto mx-auto"
              priority
            />
          </Link>
          <h1 className="text-3xl font-display font-semibold text-amari-charcoal mb-2">
            Welcome back
          </h1>
          <p className="text-amari-muted">
            Continue your storytelling journey
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white rounded-2xl shadow-lg border border-amari-sand",
              headerTitle: "text-amari-charcoal font-display",
              headerSubtitle: "text-amari-muted",
              formButtonPrimary: "bg-amari-terracotta hover:bg-[#C96A4F] text-white",
              formFieldInput: "border-amari-sand focus:border-amari-terracotta focus:ring-amari-terracotta/20",
              footerActionLink: "text-amari-terracotta hover:text-[#C96A4F]",
            }
          }}
        />
      </div>
    </div>
  )
}
