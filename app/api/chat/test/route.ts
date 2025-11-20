import { NextResponse } from 'next/server'

export async function GET() {
  const hasKey = !!process.env.ANTHROPIC_API_KEY
  const keyPrefix = process.env.ANTHROPIC_API_KEY?.substring(0, 10) || 'not set'

  return NextResponse.json({
    anthropic_key_present: hasKey,
    anthropic_key_prefix: keyPrefix,
    env_check: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
  })
}
