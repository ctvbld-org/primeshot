import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSecuredHandler, SECURITY_PRESETS } from '@/lib/security-middleware'

// Secured GET handler for inference configuration
const securedGET = createSecuredHandler(
  async (req) => {
    try {
      const supabase = await createClient()
      const [inferenceResult, creditCostsResult] = await Promise.all([
        supabase.from('inference_settings').select('key, value'),
        supabase.from('credit_costs').select('*').order('type', { ascending: true })
      ])

      if (inferenceResult.error) {
        return NextResponse.json({ error: 'Failed to fetch inference settings', details: inferenceResult.error.message }, { status: 500 })
      }
      if (creditCostsResult.error) {
        return NextResponse.json({ error: 'Failed to fetch credit costs', details: creditCostsResult.error.message }, { status: 500 })
      }

      const inferenceSettings: Record<string, any> = {}
      for (const row of inferenceResult.data || []) {
        inferenceSettings[row.key] = row.value
      }
      const creditCosts = (creditCostsResult.data || []).reduce((acc: Record<string, number>, cost: any) => {
        acc[cost.type] = cost.value
        return acc
      }, {})

      return NextResponse.json({ inferenceSettings, creditCosts })
    } catch (error: any) {
      return NextResponse.json({ error: 'Internal server error', details: error?.message || 'Unknown error' }, { status: 500 })
    }
  },
  SECURITY_PRESETS.PUBLIC // Public endpoint but with rate limiting
);

export async function GET(request: NextRequest) {
  return await securedGET(request);
}


