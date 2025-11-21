# Amari - Product Requirements Document

**Version**: 1.0
**Last Updated**: November 19, 2025
**Status**: Production
**Product Type**: B2C SaaS Web Application

---

## 🦋 Executive Summary

**Amari** is an AI-powered bedtime storytelling platform that transforms children's random items into personalized, magical bedtime stories. Built on Next.js 14 and powered by OpenAI's GPT-4, Amari combines interactive story creation, text-to-speech narration, and a tiered subscription model to deliver a unique family bonding experience.

**Tagline**: *"Every bedtime becomes a butterfly of imagination."*

### Core Value Proposition
Parents and caregivers struggle to create engaging, unique bedtime stories every night. Amari solves this by:
1. Letting children pick random items from their room
2. Generating custom stories featuring those items
3. Reading stories aloud with natural-sounding voices
4. Saving stories for repeated bedtimes

### Target Audience
- **Primary**: Parents with children ages 3-10
- **Secondary**: Grandparents, caregivers, childcare providers
- **Demographics**: English-speaking families, tech-savvy parents seeking creative solutions

### Business Model
Freemium subscription with four tiers:
- Free: 3 stories/month ($0)
- Dream Weaver: 10 stories/month ($6.99/mo)
- Magic Circle: 30 stories/month ($14.99/mo)
- Enchanted Library: 60 stories/month ($29.99/mo)

---

## 📊 Product Overview

### What is Amari?

Amari is a web application that generates personalized bedtime stories using AI. Children select random items (toys, objects, pets), choose story preferences, and Amari creates a unique, age-appropriate narrative featuring those items.

### Key Features

#### 1. AI-Powered Story Generation
- **Technology**: OpenAI GPT-4 Turbo
- **Input**: Children's names, genders, random items (up to 5 per child)
- **Output**: 300-1500 word stories with natural item integration
- **Personalization**: Character-specific pronouns, age-appropriate language
- **Variety**: Four tone options, three length options

#### 2. Interactive Story Wizard
Four-step creation process:
1. **Children Selection**: Choose 1-5 children to feature
2. **Child Details**: Name, gender, number of items per child
3. **Item Collection**: Enter random items for each child
4. **Preferences**: Select tone and length
5. **Generation**: AI creates story in 10-30 seconds

#### 3. Text-to-Speech Narration
- **Technology**: Web Speech API (browser-native)
- **Features**:
  - Adjustable playback speed (0.9x for relaxing bedtime pace)
  - Female voice preference
  - Play/pause controls
  - No external service required

#### 4. Story Library Management
- Save unlimited stories (paid tiers)
- Search by title and content
- Filter by tone (calm, funny, adventure, mystery)
- Download as text files
- Mark favorites
- View metadata (word count, read time, creation date)

#### 5. Usage Dashboard
- Real-time usage tracking
- Stories created this month
- Subscription plan display
- Recent stories preview
- Upgrade prompts for limits

#### 6. Subscription Management
- Four-tier pricing structure
- Monthly and annual billing options
- Stripe-powered checkout
- Self-service portal for plan changes
- Usage limit enforcement

---

## 🎯 User Personas

### Persona 1: Busy Parent (Primary)
**Name**: Sarah, 35
**Occupation**: Marketing Manager
**Family**: Two children (ages 5 and 7)
**Pain Points**:
- Limited time for bedtime routine
- Runs out of creative story ideas
- Children have short attention spans
- Wants quality family bonding time

**Goals**:
- Quick, engaging bedtime stories
- Personalized content for each child
- Consistent bedtime routine
- Educational yet entertaining

**How Amari Helps**:
- Generates stories in under 30 seconds
- Involves children in creation process
- Creates unique stories every night
- Saves successful stories for repeats

### Persona 2: Grandparent Caregiver
**Name**: Robert, 62
**Occupation**: Retired Teacher
**Family**: 3 grandchildren visit weekly
**Pain Points**:
- Memory of old stories fading
- Grandchildren want modern references
- Physical books don't feature grandchildren

**Goals**:
- Create memorable bonding experiences
- Keep up with grandchildren's interests
- Tell personalized stories
- Document stories for future

**How Amari Helps**:
- Features grandchildren by name
- Incorporates their current toys/interests
- Saves stories permanently
- Easy-to-use interface

### Persona 3: Working Parent Team
**Name**: Lisa & Mark, 32 & 34
**Occupation**: Both work full-time
**Family**: Three children (ages 3, 6, and 9)
**Pain Points**:
- Managing bedtime for multiple ages
- Each child wants individual attention
- Limited family time during weekdays

**Goals**:
- Efficient bedtime routine
- Include all children together
- Quality over quantity in interactions

**How Amari Helps**:
- Multi-child story feature
- Age-appropriate content
- Quick generation
- Family sharing feature (Magic Circle tier)

---

## 🏗️ System Architecture

### Technology Stack

**Frontend**:
- Next.js 14 (App Router, React Server Components)
- TypeScript (full type safety)
- Tailwind CSS (utility-first styling)
- Radix UI (accessible components)
- Framer Motion (animations)
- Zustand (client state management)
- Zod (validation)

**Backend**:
- Next.js API Routes (serverless functions)
- OpenAI API (GPT-4 Turbo for story generation)
- Supabase (PostgreSQL database)
- Clerk (authentication and user management)
- Stripe (payment processing)

**Infrastructure**:
- Vercel (hosting and deployment)
- Supabase (managed PostgreSQL)
- Stripe (payment infrastructure)
- Clerk (auth infrastructure)

### Database Schema

#### Core Tables

**users**
```sql
- id: UUID (primary key)
- clerk_id: TEXT (unique, auth reference)
- email: TEXT
- subscription_tier: ENUM (free, dream_weaver, magic_circle, enchanted_library)
- subscription_status: ENUM (free, premium, trial)
- stripe_customer_id: TEXT
- stripe_subscription_id: TEXT
- subscription_period_start: TIMESTAMPTZ
- current_period_end: TIMESTAMPTZ
- created_at, updated_at: TIMESTAMPTZ
```

**stories**
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- title: TEXT
- content: TEXT
- tone: ENUM (bedtime-calm, funny, adventure, mystery)
- length: ENUM (quick, medium, epic)
- word_count: INTEGER
- is_favorite: BOOLEAN
- audio_url: TEXT (for future premium voice feature)
- voice_provider: VARCHAR (web or elevenlabs)
- voice_config: JSONB
- created_at, updated_at: TIMESTAMPTZ
```

**story_seeds**
```sql
- id: UUID (primary key)
- story_id: UUID (foreign key to stories)
- child_name: TEXT
- seed_items: TEXT[] (array of items)
- created_at: TIMESTAMPTZ
```

**usage_tracking**
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- billing_period_start: DATE
- billing_period_end: DATE
- stories_generated: INTEGER
- premium_voices_used: INTEGER
- created_at, updated_at: TIMESTAMPTZ
- UNIQUE(user_id, billing_period_start)
```

**tier_limits**
```sql
- tier_name: subscription_tier (primary key)
- monthly_stories: INTEGER
- monthly_premium_voices: INTEGER
- max_children: INTEGER (-1 = unlimited)
- max_saved_stories: INTEGER (-1 = unlimited)
- features: JSONB
```

### Security Model

**Authentication**: Clerk JWT-based authentication
- Secure sign-up/sign-in flows
- Session management
- User profile management
- Webhook sync to Supabase

**Authorization**: Row Level Security (RLS)
- Users can only access their own data
- Policies enforce user_id matching
- Service role key for admin operations

**Data Protection**:
- Environment variables for secrets
- Stripe webhook signature verification
- Clerk webhook signature verification
- HTTPS-only communication

---

## 🎨 User Experience & Design

### Design Philosophy

**Visual Language**: Dreamy, magical, child-friendly
- **Primary Colors**: Lavender (#9b87f5), Skyblue (#7ec8e3), Cream (#fef7cd)
- **Typography**: Playfair Display (elegant serif for headings)
- **Iconography**: Lucide React icons with custom butterfly motifs
- **Animations**: Gentle floating butterflies, smooth transitions

### Key User Flows

#### 1. First-Time User Flow
```
Landing Page → Sign Up → Dashboard → Create First Story → View Result → Upgrade Prompt
```

**Steps**:
1. User visits homepage with hero section
2. Clicks "Get Started" or "Sign Up"
3. Completes Clerk sign-up flow
4. Lands on dashboard showing 0 stories
5. Clicks "Create Your First Story"
6. Goes through 4-step wizard
7. Story generates and displays
8. Banner shows "2/3 stories remaining this month"

#### 2. Story Creation Flow (Detailed)
```
Dashboard → Create → Step 1 (Children) → Step 2 (Details) → Step 3 (Items) → Step 4 (Preferences) → Generate → View Story
```

**Step 1: Select Children**
- Choose 1-5 children
- Visual cards with number buttons
- "Next" enabled after selection

**Step 2: Enter Details**
- For each child:
  - Name input field
  - Gender radio buttons (boy, girl, other)
  - Item count selector (1-5)
- Validates all fields before allowing "Next"

**Step 3: Collect Items**
- For each child:
  - Shows name and item count
  - Input fields for each item
  - Placeholder: "teddy bear, blue blanket, etc."
- Validates all items entered

**Step 4: Choose Preferences**
- **Tone Selection** (radio cards):
  - 🌙 Bedtime Calm: "Gentle and soothing"
  - 😄 Funny: "Silly and playful"
  - 🗺️ Adventure: "Exciting and brave"
  - 🔍 Mystery: "Curious and clever"
- **Length Selection** (radio cards):
  - ⚡ Quick: "2-3 minutes"
  - 📖 Medium: "5 minutes"
  - 📚 Epic: "10 minutes"
- "Generate Story" button

**Step 5: Generation & Display**
- Loading state with butterfly animation
- Progress message: "Creating your magical story..."
- On success:
  - Story title displayed prominently
  - Full story text
  - TTS controls (play, pause, speed)
  - Download button
  - "Create Another" button
  - Usage stats updated

#### 3. Subscription Upgrade Flow
```
Dashboard Limit Warning → Pricing Page → Select Tier → Stripe Checkout → Payment → Webhook → Dashboard (Upgraded)
```

**Triggers**:
- User reaches story limit
- Clicks "Upgrade" banner
- Clicks "Upgrade to Premium" in nav

**Pricing Page**:
- Four tier cards displayed
- Monthly/Annual toggle
- Feature comparison
- "Subscribe" button per tier
- FAQ section below

**Checkout**:
- Redirects to Stripe checkout
- Pre-filled email from Clerk
- Test mode: Use 4242 4242 4242 4242
- After payment, redirects to dashboard

**Post-Upgrade**:
- Webhook updates user tier instantly
- Dashboard shows new plan
- Usage limits immediately increased
- Success message displayed

---

## 🔧 Core Functionality Specifications

### Story Generation Engine

#### Input Requirements
```typescript
interface StoryGenerationRequest {
  children: Array<{
    name: string
    gender: 'boy' | 'girl' | 'other'
    itemCount: number
    items: string[]
  }>
  config: {
    tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery'
    length: 'quick' | 'medium' | 'epic'
  }
}
```

#### OpenAI Prompt Construction

**System Message**:
```
You are Amari, a magical bedtime storyteller who creates warm, imaginative,
and family-friendly stories for children. Your stories are creative, engaging,
and always include all the elements requested.
```

**User Prompt Template**:
```
Create a {tone} bedtime story that includes the following elements:

Characters:
- {child_name} ({pronouns}): {items}

{tone_instructions}
{length_instructions}

The story should:
- Include ALL the special things naturally in the narrative
- Feature {children_names} as the main character(s)
- Use the correct pronouns for each character as specified above
- Have a clear beginning, middle, and end
- Be appropriate for children ages 3-10
- Include dialogue and descriptive language
- Have a satisfying conclusion

Please provide:
1. A creative title
2. The complete story
```

**Tone Instructions**:
- **Bedtime Calm**: "Use gentle, soothing language. The story should be warm and comforting, perfect for helping children wind down for sleep. Include peaceful imagery and a cozy atmosphere. End with everyone safe and ready for sleep."
- **Funny**: "Make the story humorous and playful with silly situations, funny dialogue, and light-hearted moments that will make children giggle. Keep it family-friendly and joyful."
- **Adventure**: "Create an exciting adventure with challenges to overcome, new places to explore, and brave characters. Include action and discovery while keeping it age-appropriate."
- **Mystery**: "Build a gentle mystery with clues to discover and a puzzle to solve. Keep it intriguing but not scary, suitable for young children."

**Length Instructions**:
- **Quick**: "Keep the story brief and engaging, about 300-400 words. Perfect for a quick bedtime story."
- **Medium**: "Create a medium-length story of about 600-800 words with a clear beginning, middle, and end."
- **Epic**: "Craft a longer, more detailed story of about 1200-1500 words with rich descriptions and character development."

#### Output Processing
1. Receive GPT-4 response
2. Parse title (extract from "Title:" or "# Title" format)
3. Extract story content
4. Calculate word count
5. Save to database with metadata
6. Save story seeds (items used)
7. Track usage
8. Return story to client

#### Error Handling
- OpenAI API failures: Retry once, then show user-friendly error
- Rate limits: Queue request or show "try again" message
- Invalid input: Validate before API call
- Database errors: Log and show generic error to user

### Usage Tracking & Limits

#### Billing Period Calculation

**Free Tier**: Calendar month
```typescript
// First day of current month to last day
start: new Date(year, month, 1)
end: new Date(year, month + 1, 0)
```

**Paid Tiers**: Subscription anniversary
```typescript
// From subscription_period_start to next month same day
start: subscription_period_start
end: add 1 month to start
```

#### Limit Enforcement

**Before Story Generation**:
1. Get user's subscription tier
2. Get current billing period
3. Query usage_tracking for current period
4. Compare to tier limits
5. If exceeded, return 403 with upgrade prompt
6. If allowed, proceed

**After Story Generation**:
1. Increment stories_generated counter
2. If premium voice used, increment premium_voices_used
3. Update usage_tracking record
4. Return updated usage to client

**Usage Limits by Tier**:
| Tier | Stories/Month | Premium Voices/Month |
|------|---------------|---------------------|
| Free | 3 | 0 |
| Dream Weaver | 10 | 3 |
| Magic Circle | 30 | 15 |
| Enchanted Library | 60 | 60 |

### Text-to-Speech Implementation

#### Technology
Web Speech API (`window.speechSynthesis`)

#### Implementation
```typescript
const utterance = new SpeechSynthesisUtterance(text)
utterance.rate = 0.9 // Slower, calming pace
utterance.voice = preferredVoice // Female voice if available
speechSynthesis.speak(utterance)
```

#### Controls
- **Play**: Start speech synthesis
- **Pause**: Pause at current position
- **Resume**: Continue from pause point
- **Stop**: End playback
- **Speed**: Adjust rate (0.9x default, 1.0x normal)

#### Voice Selection
1. Load available voices
2. Filter for English (US) voices
3. Prefer female voices (better for bedtime stories)
4. Fall back to system default if preferred unavailable

---

## 💰 Monetization Strategy

### Pricing Tiers

#### Free Tier
**Price**: $0/month
**Purpose**: Lead generation, product trial
**Limits**:
- 3 stories per month
- Web voice only (no premium voices)
- Up to 2 children per story
- 5 saved stories maximum

**Target User**: Parents testing the product, occasional users

**Conversion Strategy**:
- Show upgrade banner after 2nd story
- Prominent "Upgrade" button when limit reached
- Pricing page link in navigation
- Feature comparison tooltip

#### Dream Weaver Tier
**Price**: $6.99/month or $59.99/year (save 29%)
**Purpose**: Entry-level paid tier, casual users
**Limits**:
- 10 stories per month
- 3 premium voices per month
- Up to 3 children per story
- Unlimited saved stories

**Features**:
- Story downloads (PDF, MP3)
- Basic custom themes
- Priority email support

**Target User**: Regular bedtime story users, 2-3 children

**Value Proposition**: 10 stories ≈ every 3 days, enough for regular use

#### Magic Circle Tier
**Price**: $14.99/month or $119.99/year (save 33%)
**Purpose**: Power users, larger families
**Limits**:
- 30 stories per month
- 15 premium voices per month
- Up to 5 children per story
- Unlimited saved stories

**Features**:
- All Dream Weaver features
- Family sharing (2 accounts)
- Premium custom themes
- Scheduled story delivery
- Usage analytics dashboard
- All download formats

**Target User**: Families with 3-5 children, daily users

**Value Proposition**: Daily stories, family sharing, advanced features

#### Enchanted Library Tier
**Price**: $29.99/month or $249.99/year (save 31%)
**Purpose**: Premium tier, power users, childcare providers
**Limits**:
- 60 stories per month
- 60 premium voices per month
- Unlimited children per story
- Unlimited saved stories

**Features**:
- All Magic Circle features
- Family sharing (4 accounts)
- Character voice library (future)
- Custom theme creator (future)
- Priority support (phone + email)
- Early access to new features
- 1 gift subscription per year

**Target User**: Large families, grandparents, daycare centers

**Value Proposition**: 2 stories per day, unlimited flexibility

### Revenue Projections

**Cost Structure per Story**:
- OpenAI GPT-4 Turbo: ~$0.03/story
- Infrastructure (Vercel + Supabase): ~$0.02/story
- Stripe fees: 2.9% + $0.30 per transaction
- Total cost: ~$0.05/story + premium voice ($0.30 if used)

**Profit Margins**:
| Tier | Monthly | Annual | Margin (Monthly) | Margin (Annual) |
|------|---------|--------|------------------|-----------------|
| Free | -$0.45 | - | Negative (CAC) | - |
| Dream Weaver | $6.99 | $4.99 | ~70% | ~58% |
| Magic Circle | $14.99 | $9.99 | ~50% | ~25% |
| Enchanted Library | $29.99 | $20.83 | ~30% | ~0% |

**Annual Plans Strategy**:
- Discounts incentivize commitment
- Reduces churn
- Improves cash flow
- Lower processing fees

### Future Premium Features

**Premium Voices** (ElevenLabs integration):
- Character-specific voices
- Emotional narration
- Multiple language support
- Voice cloning for parents/grandparents

**Advanced Features**:
- Story sequels (continue adventures)
- Custom illustrations (Dall-E integration)
- Video creation (stories with animations)
- Collaborative stories (multiple family members contribute)
- Story analytics (reading habits, favorite tones)
- Scheduled delivery (daily story at bedtime)
- Physical book printing

---

## 📱 API Specifications

### Core Endpoints

#### POST `/api/generate-story`
Generate a new bedtime story.

**Request**:
```typescript
{
  children: Array<{
    name: string
    gender: 'boy' | 'girl' | 'other'
    items: string[]
  }>
  config: {
    tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery'
    length: 'quick' | 'medium' | 'epic'
  }
}
```

**Response (Success)**:
```typescript
{
  story: {
    id: string
    title: string
    content: string
    wordCount: number
  }
  usage: {
    stories_generated: number
    stories_remaining: number
    billing_period_end: string
    tier: string
  }
}
```

**Response (Limit Exceeded)**:
```typescript
{
  error: string
  usage: {
    stories_generated: number
    stories_limit: number
    premium_voices_used: number
    billing_period_end: string
  }
  upgrade: {
    message: string
  }
}
```

#### GET `/api/usage`
Get current user usage and limits.

**Response**:
```typescript
{
  stories_generated: number
  stories_limit: number
  premium_voices_used: number
  premium_voices_limit: number
  billing_period_end: string
  tier: string
}
```

#### GET `/api/stories`
List user's stories.

**Query Parameters**:
- `search`: Filter by title/content
- `tone`: Filter by tone
- `limit`: Number of results (default 10)
- `offset`: Pagination offset

**Response**:
```typescript
{
  stories: Array<{
    id: string
    title: string
    content: string
    tone: string
    length: string
    word_count: number
    is_favorite: boolean
    created_at: string
  }>
  total: number
}
```

#### POST `/api/create-checkout-session`
Create Stripe checkout session.

**Request**:
```typescript
{
  priceId: string // Stripe price ID for selected tier
}
```

**Response**:
```typescript
{
  url: string // Stripe checkout URL
}
```

#### POST `/api/webhooks/stripe`
Handle Stripe webhook events.

**Events Handled**:
- `checkout.session.completed`: New subscription
- `customer.subscription.updated`: Plan changes
- `customer.subscription.deleted`: Cancellations
- `invoice.payment_succeeded`: Successful payments
- `invoice.payment_failed`: Failed payments

---

## 🧪 Testing Strategy

### Unit Testing
**Framework**: Vitest

**Coverage Areas**:
- Tier configuration functions
- Usage calculation logic
- Billing period calculations
- Tier limit checking
- Pronoun handling in prompts

### Integration Testing
**Areas**:
- Story generation end-to-end
- Stripe webhook processing
- Clerk user sync
- Usage tracking updates
- Database queries

### Manual Testing Checklist

**Story Creation**:
- [ ] Single child story
- [ ] Multi-child story (2-5 children)
- [ ] All tone options
- [ ] All length options
- [ ] Edge cases (special characters in names, many items)

**Usage Limits**:
- [ ] Free user reaches 3-story limit
- [ ] Paid user within limits
- [ ] Limit resets at billing period boundary
- [ ] Upgrade increases limits immediately

**Subscription Management**:
- [ ] New subscription checkout
- [ ] Upgrade between tiers
- [ ] Downgrade at period end
- [ ] Cancellation flow
- [ ] Reactivation after cancellation

**Text-to-Speech**:
- [ ] Play/pause functionality
- [ ] Speed adjustment
- [ ] Voice selection
- [ ] Long story handling

### Performance Testing

**Metrics**:
- Story generation time: < 30 seconds (95th percentile)
- Page load time: < 3 seconds
- Time to interactive: < 5 seconds
- API response time: < 2 seconds

**Load Testing**:
- Concurrent story generations: 100+
- Database query performance under load
- Webhook processing latency

---

## 📈 Success Metrics

### North Star Metric
**Stories Generated per User per Month**

Target: Increase from X to Y over 6 months

### Key Performance Indicators (KPIs)

**Acquisition**:
- New signups per week
- Conversion rate (visitor → signup): Target 5%
- Cost per acquisition: Target < $10

**Activation**:
- First story created: Target 70% within 24 hours
- Time to first story: Target < 5 minutes
- Stories created in first week: Target 3+

**Retention**:
- Day 7 retention: Target 40%
- Day 30 retention: Target 25%
- Monthly active users (MAU)

**Revenue**:
- Free → Paid conversion: Target 10%
- Monthly recurring revenue (MRR)
- Customer lifetime value (LTV): Target > $100
- Churn rate: Target < 5% monthly

**Engagement**:
- Stories per active user per month
- Return rate (users creating 2+ stories)
- Average story length preference
- Tone distribution

### Analytics Implementation

**Tracking Events**:
- `user_signup`: New user registration
- `story_created`: Story generation completed
- `story_played`: TTS initiated
- `story_downloaded`: Story downloaded
- `upgrade_viewed`: Pricing page viewed
- `upgrade_started`: Checkout initiated
- `upgrade_completed`: Subscription activated
- `story_limit_reached`: User hits limit

**Tools**:
- PostHog (product analytics)
- Stripe Dashboard (revenue metrics)
- Supabase Analytics (database performance)

---

## 🔮 Future Roadmap

### Phase 3: Enhanced Voice Features (Q1 2026)
- ElevenLabs premium voice integration
- Character-specific voices
- Emotional tone in narration
- Voice preview before generation
- Save voice preferences

### Phase 4: Visual Enhancements (Q2 2026)
- Story illustrations (Dall-E)
- Animated story viewers
- Custom character avatars
- Themeable story cards
- PDF formatting improvements

### Phase 5: Social & Sharing (Q3 2026)
- Share stories with family members
- Public story library (optional)
- Story ratings and reviews
- Collaborative story creation
- Community features

### Phase 6: Mobile Apps (Q4 2026)
- iOS native app
- Android native app
- Offline story access
- Push notifications for scheduled stories
- Mobile-optimized TTS

### Phase 7: Educational Features (2027)
- Reading comprehension questions
- Vocabulary building
- Age-appropriate lessons
- Progress tracking
- Teacher/educator accounts

### Phase 8: Internationalization (2027)
- Multi-language support
- Localized story themes
- Cultural adaptations
- International payment methods

---

## 🛡️ Privacy & Compliance

### Data Collection
**Personal Information**:
- Email address (for account)
- Name (optional, for personalization)
- Payment information (via Stripe, not stored)

**User-Generated Content**:
- Children's names (stored in stories)
- Story content and preferences
- Usage statistics

**Analytics**:
- Page views and interactions
- Feature usage
- Error logs

### Privacy Commitments
- **No selling of data**: User data never sold to third parties
- **Minimal collection**: Only collect what's necessary
- **User control**: Users can delete stories anytime
- **Transparency**: Clear privacy policy
- **Child privacy**: COPPA compliant (not collecting data from children)

### Security Measures
- Encryption at rest and in transit
- Regular security audits
- Webhook signature verification
- Row Level Security (RLS) in database
- Environment variable protection

### Compliance
- **GDPR**: Data export and deletion on request
- **CCPA**: California privacy rights respected
- **COPPA**: No direct collection from children under 13
- **PCI DSS**: Stripe handles all payment data

---

## 🤝 User Support

### Support Channels
- **Email**: support@amari.app (all tiers)
- **Help Center**: docs.amari.app (FAQs, guides)
- **In-app Chat**: For paid tiers (future)
- **Phone**: Enchanted Library tier only

### Common Support Issues

**Account & Billing**:
- Password reset
- Email change
- Subscription cancellation
- Billing disputes
- Refund requests

**Technical Issues**:
- Story generation failures
- TTS not working
- Login problems
- Payment failures
- Slow performance

**Feature Questions**:
- How to use multi-child stories
- Understanding tone options
- Downloading stories
- Upgrading plans
- Usage limits

### Self-Service Resources
- Interactive tutorial on first login
- Tooltip explanations throughout app
- FAQ page with common questions
- Video tutorials (future)
- Community forum (future)

---

## 📊 Competitive Analysis

### Direct Competitors

**1. Storybook AI**
- Strengths: Better illustrations, mobile app
- Weaknesses: More expensive, fewer customization options
- Differentiation: Amari has multi-child support, better TTS

**2. BedtimeStory.ai**
- Strengths: More story templates, voice cloning
- Weaknesses: Complex interface, higher pricing
- Differentiation: Amari is simpler, family-focused

**3. TaleBot**
- Strengths: Educational focus, progress tracking
- Weaknesses: Less creative stories, limited personalization
- Differentiation: Amari prioritizes magic and creativity

### Indirect Competitors
- Traditional storybooks
- Audiobook apps (Audible, Spotify)
- YouTube kids content
- Kindle Kids

### Competitive Advantages
1. **Multi-child stories**: Unique feature not found elsewhere
2. **Tone customization**: Four distinct story tones
3. **Pricing**: Competitive freemium model
4. **Speed**: Sub-30-second generation time
5. **Simplicity**: Clean, focused interface
6. **Family-centric**: Built specifically for family bonding

---

## 🎯 Go-to-Market Strategy

### Launch Strategy

**Phase 1: Private Beta**
- 100 select families
- Gather feedback
- Refine onboarding
- Test pricing

**Phase 2: Public Launch**
- Product Hunt launch
- Press outreach
- Social media campaign
- Influencer partnerships

**Phase 3: Growth**
- Content marketing
- SEO optimization
- Paid acquisition (Google, Facebook)
- Referral program

### Marketing Channels

**Content Marketing**:
- Blog: "Benefits of bedtime stories"
- Parent guides: "Creative bedtime routines"
- SEO keywords: "bedtime stories for kids", "AI story generator"

**Social Media**:
- Instagram: Visual story snippets, family testimonials
- TikTok: Short form story creations, behind-the-scenes
- Facebook: Parent groups, community building

**Partnerships**:
- Parenting bloggers and influencers
- Children's book authors
- Pediatricians and child development experts
- Daycare and preschool programs

**Paid Acquisition**:
- Google Ads: High-intent keywords
- Facebook/Instagram Ads: Targeting parents
- YouTube Pre-roll: Bedtime routine videos

### Pricing Strategy
- **Free tier**: Generous (3 stories) to reduce friction
- **Entry tier**: Low ($6.99) to encourage upgrades
- **Annual discounts**: 25-35% off to improve retention
- **First month discount**: Consider for acquisition

---

## 📝 Conclusion

Amari is a production-ready, AI-powered bedtime storytelling platform that successfully combines:
- **Technology**: GPT-4, Next.js, Stripe, Supabase
- **Creativity**: Personalized, tone-aware story generation
- **Monetization**: Tiered subscription with clear value proposition
- **User Experience**: Simple, magical, family-focused design

**Current Status**: Fully operational with 4-tier subscription system, usage tracking, and comprehensive story generation capabilities.

**Next Steps**: Local testing, production deployment, user acquisition, and iterative feature enhancement based on user feedback.

---

**Document Version History**:
- v1.0 (Nov 19, 2025): Initial comprehensive PRD

**Maintainers**: Product & Engineering Teams
**Review Cycle**: Quarterly updates based on product evolution
