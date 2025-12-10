import { Resend } from 'resend';

// =============================================================================
// Resend Email Client Configuration
// =============================================================================

// Check if Resend is configured
export const isEmailEnabled = !!process.env.RESEND_API_KEY;

// Initialize Resend client (only if configured)
const resend = isEmailEnabled
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Email sender address
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'MyAmari <hello@myamari.ai>';

// =============================================================================
// Email Types
// =============================================================================

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface TrialWelcomeData {
  name: string;
  tierName: string;
  storyLimit: number;
  voiceLimit: number;
  trialEndDate: string;
}

interface TrialReminderData {
  name: string;
  tierName: string;
  daysLeft: number;
  trialEndDate: string;
  storiesCreated: number;
  price: string;
}

interface TrialEndingData {
  name: string;
  tierName: string;
  trialEndDate: string;
  price: string;
}

// =============================================================================
// Core Email Function
// =============================================================================

/**
 * Send an email via Resend
 * Returns null if email is not configured (fail gracefully)
 */
export async function sendEmail(options: EmailOptions): Promise<{ id: string } | null> {
  if (!resend) {
    console.warn('[email] Resend not configured, skipping email');
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    if (error) {
      console.error('[email] Resend error:', error);
      return null;
    }

    console.log('[email] Email sent:', data?.id);
    return { id: data?.id || '' };
  } catch (error) {
    console.error('[email] Failed to send email:', error);
    return null;
  }
}

// =============================================================================
// Trial Email Templates
// =============================================================================

/**
 * Send welcome email when trial starts
 */
export async function sendTrialWelcomeEmail(
  email: string,
  data: TrialWelcomeData
): Promise<{ id: string } | null> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to MyAmari!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #7c3aed; margin-bottom: 10px;">Welcome to MyAmari!</h1>
    <p style="font-size: 18px; color: #666;">Your magical journey begins</p>
  </div>

  <p>Hi ${data.name},</p>

  <p>Welcome to MyAmari! Your <strong>14-day free trial</strong> of <strong>${data.tierName}</strong> is now active.</p>

  <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 12px; padding: 20px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #7c3aed;">Here's what you can do:</h3>
    <ul style="margin: 0; padding-left: 20px;">
      <li>Create up to <strong>${data.storyLimit} personalized bedtime stories</strong></li>
      <li>Use <strong>${data.voiceLimit} premium AI voices</strong> for narration</li>
      <li>Generate <strong>beautiful illustrations</strong> for your stories</li>
    </ul>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://www.myamari.ai/dashboard" style="background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
      Start Creating Stories
    </a>
  </div>

  <p style="color: #666; font-size: 14px;">
    Your trial ends on <strong>${data.trialEndDate}</strong>. We'll remind you before it ends.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p>Happy storytelling!</p>
  <p><strong>The MyAmari Team</strong></p>

  <p style="color: #999; font-size: 12px; margin-top: 30px;">
    Questions? Reply to this email or visit our <a href="https://www.myamari.ai/support" style="color: #7c3aed;">help center</a>.
  </p>
</body>
</html>
  `.trim();

  const text = `
Welcome to MyAmari!

Hi ${data.name},

Welcome to MyAmari! Your 14-day free trial of ${data.tierName} is now active.

Here's what you can do:
- Create up to ${data.storyLimit} personalized bedtime stories
- Use ${data.voiceLimit} premium AI voices for narration
- Generate beautiful illustrations for your stories

Get started: https://www.myamari.ai/dashboard

Your trial ends on ${data.trialEndDate}. We'll remind you before it ends.

Happy storytelling!
The MyAmari Team
  `.trim();

  return sendEmail({
    to: email,
    subject: 'Welcome to MyAmari! Your magical journey begins',
    html,
    text,
  });
}

/**
 * Send reminder email (4 days before trial ends)
 */
export async function sendTrialReminderEmail(
  email: string,
  data: TrialReminderData
): Promise<{ id: string } | null> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #7c3aed; margin-bottom: 10px;">${data.daysLeft} days left in your trial</h1>
  </div>

  <p>Hi ${data.name},</p>

  <p>Just a heads up - your MyAmari trial ends in <strong>${data.daysLeft} days</strong> (${data.trialEndDate}).</p>

  <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0; font-size: 18px;">
      You've created <strong>${data.storiesCreated} stories</strong> so far!
    </p>
  </div>

  <p>To keep your stories and continue creating:</p>
  <ul>
    <li>Your <strong>${data.tierName}</strong> subscription will automatically start</li>
    <li>You'll be charged <strong>${data.price}/month</strong></li>
  </ul>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://www.myamari.ai/settings/subscription" style="background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
      Manage Subscription
    </a>
  </div>

  <p style="color: #666; font-size: 14px;">
    Want to change plans or cancel? <a href="https://www.myamari.ai/settings/subscription" style="color: #7c3aed;">Manage your subscription</a>
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p>Keep the magic going!</p>
  <p><strong>The MyAmari Team</strong></p>
</body>
</html>
  `.trim();

  const text = `
${data.daysLeft} days left in your MyAmari trial

Hi ${data.name},

Just a heads up - your MyAmari trial ends in ${data.daysLeft} days (${data.trialEndDate}).

You've created ${data.storiesCreated} stories so far!

To keep your stories and continue creating:
- Your ${data.tierName} subscription will automatically start
- You'll be charged ${data.price}/month

Want to change plans or cancel? https://www.myamari.ai/settings/subscription

Keep the magic going!
The MyAmari Team
  `.trim();

  return sendEmail({
    to: email,
    subject: `${data.daysLeft} days left in your MyAmari trial`,
    html,
    text,
  });
}

/**
 * Send final reminder email (1 day before trial ends)
 */
export async function sendTrialEndingEmail(
  email: string,
  data: TrialEndingData
): Promise<{ id: string } | null> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #7c3aed; margin-bottom: 10px;">Your trial ends tomorrow</h1>
  </div>

  <p>Hi ${data.name},</p>

  <p>Your 14-day trial ends <strong>tomorrow</strong> (${data.trialEndDate}).</p>

  <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #7c3aed;">What happens next:</h3>
    <ul style="margin: 0; padding-left: 20px;">
      <li>Your <strong>${data.tierName}</strong> subscription begins automatically</li>
      <li>You'll be charged <strong>${data.price}</strong></li>
      <li>All your stories are saved</li>
    </ul>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://www.myamari.ai/settings/subscription" style="background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
      Manage Subscription
    </a>
  </div>

  <p style="color: #666; font-size: 14px;">
    Need to make changes? <a href="https://www.myamari.ai/settings/subscription" style="color: #7c3aed;">Update your subscription</a>
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p>Thank you for trying MyAmari!</p>
  <p><strong>The MyAmari Team</strong></p>
</body>
</html>
  `.trim();

  const text = `
Your MyAmari trial ends tomorrow

Hi ${data.name},

Your 14-day trial ends tomorrow (${data.trialEndDate}).

What happens next:
- Your ${data.tierName} subscription begins automatically
- You'll be charged ${data.price}
- All your stories are saved

Need to make changes? https://www.myamari.ai/settings/subscription

Thank you for trying MyAmari!
The MyAmari Team
  `.trim();

  return sendEmail({
    to: email,
    subject: 'Your MyAmari trial ends tomorrow',
    html,
    text,
  });
}

// =============================================================================
// Transactional Email Templates
// =============================================================================

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmationEmail(
  email: string,
  data: {
    name: string;
    tierName: string;
    price: string;
    nextBillingDate: string;
  }
): Promise<{ id: string } | null> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #7c3aed;">Subscription Confirmed!</h1>
  </div>

  <p>Hi ${data.name},</p>

  <p>Thank you for subscribing to MyAmari <strong>${data.tierName}</strong>!</p>

  <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Plan:</strong> ${data.tierName}</p>
    <p style="margin: 10px 0 0;"><strong>Amount:</strong> ${data.price}</p>
    <p style="margin: 10px 0 0;"><strong>Next billing date:</strong> ${data.nextBillingDate}</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://www.myamari.ai/dashboard" style="background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
      Start Creating Stories
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p>Welcome to the family!</p>
  <p><strong>The MyAmari Team</strong></p>
</body>
</html>
  `.trim();

  return sendEmail({
    to: email,
    subject: 'Welcome to MyAmari! Subscription Confirmed',
    html,
  });
}

/**
 * Send gift received email
 */
export async function sendGiftReceivedEmail(
  email: string,
  data: {
    recipientName: string;
    senderName: string;
    giftMessage?: string;
    giftCode: string;
    tierName: string;
    duration: string;
  }
): Promise<{ id: string } | null> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #7c3aed;">You've received a gift!</h1>
  </div>

  <p>Hi ${data.recipientName},</p>

  <p><strong>${data.senderName}</strong> has sent you a magical gift - <strong>${data.duration}</strong> of MyAmari <strong>${data.tierName}</strong>!</p>

  ${data.giftMessage ? `
  <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin: 20px 0; font-style: italic;">
    "${data.giftMessage}"
    <p style="margin: 10px 0 0; font-style: normal; color: #666;">- ${data.senderName}</p>
  </div>
  ` : ''}

  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
    <p style="color: white; margin: 0 0 10px; font-size: 14px;">Your gift code:</p>
    <p style="color: white; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">${data.giftCode}</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://www.myamari.ai/gifts/redeem?code=${data.giftCode}" style="background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
      Redeem Your Gift
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p>Enjoy your magical stories!</p>
  <p><strong>The MyAmari Team</strong></p>
</body>
</html>
  `.trim();

  return sendEmail({
    to: email,
    subject: `${data.senderName} sent you a MyAmari gift!`,
    html,
  });
}
