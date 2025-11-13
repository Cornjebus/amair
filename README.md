# 🦋 Amari - Magical Bedtime Storyteller

> Every bedtime becomes a butterfly of imagination.

Amari is a production-ready Next.js application that creates personalized, AI-generated bedtime stories for families. Children pick random items, and Amari weaves them into magical stories perfect for bedtime.

## ✨ Features

- **AI-Powered Story Generation**: Uses OpenAI GPT-4 to create unique, engaging stories
- **Interactive Story Creation**: Multi-step wizard for children to input their creative ideas
- **Text-to-Speech**: Built-in read-aloud feature using Web Speech API
- **User Authentication**: Secure authentication with Clerk
- **Subscription Management**: Stripe integration for premium subscriptions
- **Story Library**: Save and organize all your created stories
- **Beautiful UI**: Dreamy, child-friendly design with Tailwind CSS
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **AI**: OpenAI GPT-4
- **UI Components**: Radix UI + Custom Components
- **Animations**: Framer Motion

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Accounts set up for:
  - [Clerk](https://clerk.com) - Authentication
  - [Supabase](https://supabase.com) - Database
  - [Stripe](https://stripe.com) - Payments
  - [OpenAI](https://openai.com) - AI Story Generation

## 🛠️ Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd amair
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=your_monthly_price_id

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Set up Supabase Database**

Run the SQL schema in your Supabase project:

```bash
# Copy the contents of supabase/schema.sql
# Paste into Supabase SQL Editor and run
```

5. **Configure Webhooks**

**Clerk Webhook:**
- Go to Clerk Dashboard → Webhooks
- Add endpoint: `https://your-domain.com/api/webhooks/clerk`
- Subscribe to: `user.created`, `user.deleted`

**Stripe Webhook:**
- Go to Stripe Dashboard → Developers → Webhooks
- Add endpoint: `https://your-domain.com/api/webhooks/stripe`
- Subscribe to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

6. **Create Stripe Products**

In Stripe Dashboard, create:
- Product: "Amari Premium"
- Price: $9.99/month (recurring)
- Copy the Price ID to `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID`

7. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Project Structure

```
amair/
├── app/                        # Next.js app directory
│   ├── (app)/                 # Authenticated app routes
│   │   ├── create/            # Story creation page
│   │   ├── dashboard/         # User dashboard
│   │   ├── stories/           # Stories library
│   │   └── pricing/           # Pricing page
│   ├── (auth)/                # Authentication pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── api/                   # API routes
│   │   ├── webhooks/          # Webhook handlers
│   │   ├── generate-story/    # Story generation
│   │   └── create-checkout-session/
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page
├── components/                # React components
│   ├── ui/                    # Base UI components
│   └── story/                 # Story-specific components
├── lib/                       # Utility libraries
│   ├── stripe/                # Stripe configuration
│   ├── supabase/              # Supabase client
│   └── utils.ts               # Helper functions
├── supabase/                  # Database schema
│   └── schema.sql             # SQL schema
├── middleware.ts              # Clerk middleware
├── tailwind.config.ts         # Tailwind configuration
└── package.json               # Dependencies
```

## 🎨 Features Breakdown

### Story Creation Flow

1. **Step 1**: Enter number of children (1-5)
2. **Step 2**: For each child:
   - Enter their name
   - Choose number of items (1-5)
3. **Step 3**: Enter random items for each child
4. **Step 4**: Select tone and length
5. **Generate**: AI creates a personalized story

### Story Tones

- 🌙 **Bedtime Calm**: Gentle, soothing stories perfect for sleep
- 😄 **Funny**: Humorous adventures that make kids giggle
- 🗺️ **Adventure**: Exciting journeys with challenges to overcome
- 🔍 **Mystery**: Gentle mysteries with clues to discover

### Story Lengths

- **Quick**: 2-3 minutes (300-400 words)
- **Medium**: 5 minutes (600-800 words)
- **Epic**: 10 minutes (1200-1500 words)

## 💳 Subscription Tiers

### Free Plan
- 3 stories per month
- All story tones
- Read aloud feature
- Download stories

### Premium Plan ($9.99/month)
- Unlimited stories
- All features from Free
- Save favorite stories
- Priority support
- Early access to new features

## 🔒 Security Features

- Row Level Security (RLS) in Supabase
- Secure webhook verification
- Environment variable protection
- Clerk authentication
- HTTPS-only in production

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub

2. Import project in Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository

3. Configure environment variables in Vercel:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`

4. Deploy!

5. Update webhook URLs:
   - Update Clerk webhook to your production URL
   - Update Stripe webhook to your production URL

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:

- All Clerk keys
- All Supabase keys
- All Stripe keys
- OpenAI API key
- Set `NEXT_PUBLIC_APP_URL` to your production domain

## 🧪 Testing Webhooks Locally

Use Stripe CLI and ngrok for local webhook testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Use ngrok for Clerk webhooks
ngrok http 3000
```

## 📝 TODO for Production

- [ ] Set up proper error monitoring (Sentry)
- [ ] Add analytics (PostHog, Google Analytics)
- [ ] Implement rate limiting
- [ ] Add email notifications
- [ ] Create admin dashboard
- [ ] Add story illustrations (DALL-E integration)
- [ ] Implement daily challenge feature
- [ ] Add child profile management
- [ ] Create storybook compilation feature
- [ ] Add social sharing features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 💌 Support

For support, email support@amari.app or open an issue in the repository.

---

Built with ❤️ for magical bedtimes 🦋🌙✨
