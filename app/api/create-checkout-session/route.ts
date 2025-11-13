import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { stripe } from '@/lib/stripe/server'

export async function POST(req: Request) {
  try {
    const { userId } = auth()

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

    const session = await stripe.checkout.sessions.create({
      mode: mode as 'subscription' | 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        clerk_user_id: userId,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (err: any) {
    console.error('Error creating checkout session:', err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
