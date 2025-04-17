import { NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for validating the request payload
const updateOrderAmountSchema = z.object({
  orderId: z.string().uuid(),
  newAmount: z.number().positive(),
  // Add other required fields based on API requirements
})

// Check if API URL is set
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!SUPABASE_URL) {
  console.error('CRITICAL ERROR: NEXT_PUBLIC_SUPABASE_URL is not set. Proxy functionality will fail.');
  throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

const API_TIMEOUT = 10000 // 10 seconds

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json()
    
    try {
      updateOrderAmountSchema.parse(body)
    } catch (validationError) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }
    
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)
    
    try {
      // Forward the request to the Primeshot API
      const response = await fetch(`${SUPABASE_URL}/functions/v1/update_order_amount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      // Handle different response statuses appropriately
      if (!response.ok) {
        const errorStatus = response.status
        
        // Log the detailed error but return a sanitized response
        const errorDetail = await response.text()
        console.error(`API error (${errorStatus}):`, errorDetail)
        
        return NextResponse.json(
          { error: 'Error processing request' },
          { status: errorStatus }
        )
      }
      
      // Get the response data for successful responses
      const data = await response.json()
      
      // Return the response with appropriate status
      return NextResponse.json(data)
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out' },
          { status: 504 }
        )
      }
      
      throw fetchError
    }
    
  } catch (error) {
    console.error('Error proxying request to Primeshot API:', error)
    
    // Return a generic error message to avoid leaking implementation details
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 