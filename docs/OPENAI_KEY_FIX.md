# OpenAI API Key Fix Required

## Issue
The OPENAI_API_KEY in Vercel Production contains newline characters (`\n`) which causes the error:
```
"OPENAI_API_KEY contains newline characters - this will cause connection errors"
```

This is preventing story generation from working.

## Solution

You need to **generate a new OpenAI API key** and add it to Vercel without any newline characters.

### Steps:

#### 1. Generate New API Key

Go to: https://platform.openai.com/api-keys

1. Click **"+ Create new secret key"**
2. Name it: "Amari Production"
3. Copy the key **immediately** (you can only see it once)
4. **IMPORTANT**: Don't copy any extra whitespace or newlines

#### 2. Add Key to Vercel (Method A - Recommended)

Via Vercel Dashboard:
1. Go to: https://vercel.com/cornelius-s-projects/amair/settings/environment-variables
2. Find `OPENAI_API_KEY`
3. Click "Edit"
4. Paste the new key (ensure no trailing spaces/newlines)
5. Save
6. Redeploy: `vercel --prod`

#### 3. Add Key to Vercel (Method B - CLI)

```bash
# Remove old key
vercel env rm OPENAI_API_KEY production --yes

# Add new key interactively (paste when prompted)
vercel env add OPENAI_API_KEY production
# Paste your key, press Enter

# Redeploy
vercel --prod
```

#### 4. Update Local .env.local

Update your `.env.local` file with the new key:
```bash
OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
```

**IMPORTANT**: Ensure there are NO newlines, NO quotes, just the raw key.

#### 5. Verify

After redeployment, check:
```bash
curl https://amair.vercel.app/api/health | jq '.checks.openai'
```

Should show:
```json
{
  "status": "ok",
  "message": "Connected - XX models available"
}
```

## Why This Happened

The original API key in the environment files had newline characters:
- `.env.production` had: `OPENAI_API_KEY="sk-proj-...\n"`
- When copied to Vercel, the `\n` was included

## Prevention

Always:
1. Use raw key values without quotes in env files
2. Trim whitespace when copying keys
3. Use the health endpoint to verify: `/api/health`

---

**After fixing, story generation will work! 🎉**
