import { SignUp } from '@clerk/nextjs'
import { LogoInline } from '@/components/ui/Logo'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <LogoInline size="lg" linkTo="/" />
          </div>
          <h1 className="text-3xl font-display font-semibold text-amari-charcoal mb-2">
            Join Amari
          </h1>
          <p className="text-amari-muted">
            Start creating magical bedtime stories
          </p>
        </div>
        <SignUp
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
