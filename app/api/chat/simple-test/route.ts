import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    console.log('[Simple Test] Starting...')

    // Check API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key' }, { status: 500 })
    }

    console.log('[Simple Test] API key present:', apiKey.substring(0, 20))

    // Create client
    const anthropic = new Anthropic({ apiKey })
    console.log('[Simple Test] Client created')

    // Simple message (no tools)
    const { message } = await request.json()
    console.log('[Simple Test] Message:', message)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 100,
      messages: [{ role: 'user', content: message || 'Say hello' }],
    })

    console.log('[Simple Test] Response received')

    const text = response.content[0]?.type === 'text' ? response.content[0].text : 'No text'

    return NextResponse.json({
      success: true,
      message: text,
      model: response.model,
    })
  } catch (error: any) {
    console.error('[Simple Test] Error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
      details: JSON.stringify(error, null, 2),
    }, { status: 500 })
  }
}
