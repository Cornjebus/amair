export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-skyblue-50 to-cream-50">
      {children}
    </div>
  )
}
