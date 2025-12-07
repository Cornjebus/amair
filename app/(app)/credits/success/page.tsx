import { redirect } from 'next/navigation'

// Credits success page is deprecated - redirect to dashboard
export default function CreditsSuccessPage() {
  redirect('/dashboard')
}
