import { redirect } from 'next/navigation'

// Credits page is deprecated - redirect to pricing
export default function CreditsPage() {
  redirect('/pricing')
}
