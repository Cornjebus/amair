import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe/server'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { priceId, mode = 'subscription' } = await req.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Verify environment variables
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('Missing NEXT_PUBLIC_APP_URL')
      throw new Error('Server configuration error: Missing app URL')
    }

    // Clean the app URL - remove any whitespace, newlines, or escape sequences
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '')
      .replace(/\\n/g, '') // Remove literal \n
      .replace(/\n/g, '')  // Remove actual newlines
      .replace(/\r/g, '')  // Remove carriage returns
      .trim()              // Remove leading/trailing whitespace

    console.log('Creating checkout session with:', {
      priceId,
      mode,
      userId,
      appUrl,
      appUrlRaw: process.env.NEXT_PUBLIC_APP_URL,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyLength: process.env.STRIPE_SECRET_KEY?.length
    })

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: mode as 'subscription' | 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        clerk_user_id: userId,
      },
    })

    console.log('Checkout session created successfully:', session.id)
    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })
  } catch (err: any) {
    console.error('Error creating checkout session:', {
      message: err.message,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack
    })
    return NextResponse.json(
      { error: err.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
