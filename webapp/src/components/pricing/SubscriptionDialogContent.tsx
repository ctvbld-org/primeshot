import { useState } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { Badge } from '@primeshot/common/web/ui/badge'
import { RadioGroup, RadioGroupItem } from '@primeshot/common/web/ui/radio-group'
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/constants/pricing'
import { toast } from 'sonner'
import { useAuth } from '@primeshot/common/hooks/AuthContext'
import { getApiUrl } from '@/lib/api/client'

function formatPrice(price:number){return `$${price.toFixed(2)}`}

export function SubscriptionDialogContent(){
  const [billingCycle,setBillingCycle]=useState<'monthly'|'yearly'>('monthly')
  const [selectedTier,setSelectedTier]=useState<SubscriptionTier>(()=>SUBSCRIPTION_TIERS[1])
  const [loading,setLoading]=useState(false)
  const {user}=useAuth()

  const handlePurchase=async()=>{
    if(!user){toast.error('Please log in');return}
    const priceId=billingCycle==='yearly'&&selectedTier.stripePriceIds.yearly?selectedTier.stripePriceIds.yearly!:selectedTier.stripePriceIds.monthly
    setLoading(true)
    try{
      const successPath = process.env.NEXT_PUBLIC_POST_LOGIN_PATH || '/'
      const res=await fetch(getApiUrl('/api/payment/subscription-checkout'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({priceId,successUrl:`${window.location.origin}${successPath}?subscription=success`,cancelUrl:`${window.location.origin}/pricing`})})
      if(!res.ok){const e=await res.json();throw new Error(e.error||'Checkout failed')}
      const {url}=await res.json();window.location.href=url
    }catch(e){toast.error(e instanceof Error?e.message:'Checkout failed')}finally{setLoading(false)}
  }

  return(
    <div className="space-y-4">
      {/* billing toggle */}
      <div className="flex justify-center gap-4">
        <Button variant={billingCycle==='monthly'?'primary':'secondary'} onClick={()=>setBillingCycle('monthly')}>Monthly</Button>
        <Button variant={billingCycle==='yearly'?'primary':'secondary'} onClick={()=>setBillingCycle('yearly')}>Yearly</Button>
      </div>
      <RadioGroup value={selectedTier.id} onValueChange={val=>{const t=SUBSCRIPTION_TIERS.find(t=>t.id===val);if(t) setSelectedTier(t)}} className="space-y-4">
        {SUBSCRIPTION_TIERS.map(tier=>{
          const price=billingCycle==='yearly'&&tier.stripePriceIds.yearly?tier.yearlyPrice!:tier.monthlyPrice
          return(
            <label key={tier.id} className={`border rounded-lg p-4 flex justify-between items-center cursor-pointer ${selectedTier.id===tier.id?'border-primary':'border-muted'}`}> 
              <div className="space-y-1">
                <div className="flex items-center gap-2"><span className="font-medium capitalize">{tier.displayName}</span>{tier.id==='standard'&&<Badge variant="default">Recommended</Badge>}</div>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </div>
              <div className="text-xl font-bold">{formatPrice(price)}</div>
              <RadioGroupItem value={tier.id} id={tier.id}/>
            </label>)})}
      </RadioGroup>
      <Button className="w-full" onClick={handlePurchase} disabled={loading}>{loading?'Processing…':`Purchase ${selectedTier.displayName}`}</Button>
    </div>)
} 