import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Forward the request to the Primeshot API
    const response = await fetch('https://api.primeshot.ai/functions/v1/update_order_amount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any needed authorization headers
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    })
    
    // Get the response data
    const data = await response.json()
    
    // Return the response
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error proxying request to Primeshot API:', error)
    return NextResponse.json(
      { error: 'Failed to proxy request to Primeshot API' },
      { status: 500 }
    )
  }
} 