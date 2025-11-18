import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      openai: { status: 'unknown', message: '' },
      supabase: { status: 'unknown', message: '' },
      env_vars: { status: 'unknown', message: '', details: {} as Record<string, boolean> },
    },
  }

  // Check environment variables
  try {
    checks.checks.env_vars.details = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
    }

    const missing = Object.entries(checks.checks.env_vars.details)
      .filter(([_, exists]) => !exists)
      .map(([key]) => key)

    if (missing.length === 0) {
      checks.checks.env_vars.status = 'ok'
      checks.checks.env_vars.message = 'All required environment variables are set'
    } else {
      checks.checks.env_vars.status = 'error'
      checks.checks.env_vars.message = `Missing variables: ${missing.join(', ')}`
    }
  } catch (error: any) {
    checks.checks.env_vars.status = 'error'
    checks.checks.env_vars.message = error.message
  }

  // Check OpenAI API
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set')
    }

    // Check for newline characters in the API key
    if (process.env.OPENAI_API_KEY.includes('\n') || process.env.OPENAI_API_KEY.includes('\\n')) {
      throw new Error('OPENAI_API_KEY contains newline characters - this will cause connection errors')
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Simple API call to verify connection
    const models = await openai.models.list()

    if (models.data.length > 0) {
      checks.checks.openai.status = 'ok'
      checks.checks.openai.message = `Connected - ${models.data.length} models available`
    } else {
      checks.checks.openai.status = 'warning'
      checks.checks.openai.message = 'Connected but no models found'
    }
  } catch (error: any) {
    checks.checks.openai.status = 'error'
    checks.checks.openai.message = error.message || 'OpenAI connection failed'
  }

  // Check Supabase connection
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables are not set')
    }

    // Simple query to verify connection
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact', head: true })

    if (error) {
      throw error
    }

    checks.checks.supabase.status = 'ok'
    checks.checks.supabase.message = 'Connected to Supabase database'
  } catch (error: any) {
    checks.checks.supabase.status = 'error'
    checks.checks.supabase.message = error.message || 'Supabase connection failed'
  }

  // Determine overall status
  const hasErrors = Object.values(checks.checks).some((check) => check.status === 'error')
  const statusCode = hasErrors ? 503 : 200

  return NextResponse.json(checks, { status: statusCode })
}
