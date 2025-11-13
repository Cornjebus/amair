import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-lavender-400 to-skyblue-400 rounded-full flex items-center justify-center butterfly-glow animate-flutter">
              <span className="text-4xl">🦋</span>
            </div>
          </div>
          <h1 className="text-4xl font-playfair font-bold text-lavender-900 mb-2">
            Welcome back to Amari
          </h1>
          <p className="text-lavender-600">
            Every bedtime becomes a butterfly of imagination
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "amari-card shadow-xl",
            }
          }}
        />
      </div>
    </div>
  )
}
