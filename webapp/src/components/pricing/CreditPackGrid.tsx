import { Button } from '@primeshot/common/web/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { extractQualityCosts, getTrainingCost, getPackIcon, getPackColor, formatCredits, formatValidity } from './utils'

export interface CreditPackItem {
  name: string
  credits: number
  price: number
  validity_days?: number
}

interface Props {
  packs: CreditPackItem[]
  creditCosts: Record<string, number>
  onPurchase: (pack: CreditPackItem) => void
  isProcessing?: (packName: string) => boolean
  highlight?: (pack: CreditPackItem) => boolean
  buttonVariant?: 'primary' | 'secondary'
  buttonSize?: 'sm' | 'lg'
}

export function CreditPackGrid({
  packs,
  creditCosts,
  onPurchase,
  isProcessing,
  highlight,
  buttonVariant = 'secondary',
  buttonSize = 'lg'
}: Props) {
  const qualityCosts = extractQualityCosts(creditCosts)
  const trainingCost = getTrainingCost(creditCosts)

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {packs.map((pack) => (
        <Card
          key={`${pack.name}-${pack.credits}`}
          className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-muted-foreground/50 ${
            highlight?.(pack) ? 'border-blue-200 ring-1 ring-blue-200' : ''
          }`}
        >
          <CardHeader className="text-center pb-4">
            <div className={`mx-auto mb-4 ${getPackColor(pack.credits)}`}>{getPackIcon(pack.credits, 6)}</div>
            <CardTitle className="text-xl font-bold">{pack.name}</CardTitle>
            <CardDescription className="text-sm">{formatCredits(pack.credits)} Credits</CardDescription>

            <div className="mt-4">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold">${pack.price}</span>
                <span className="text-muted-foreground text-sm">one-time</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                ${(pack.price / Math.max(pack.credits, 1)).toFixed(3)} per credit
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-6">
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Credits:</span>
                    <span className="font-medium ml-2">{formatCredits(pack.credits)}</span>
                  </div>
                  {pack.validity_days != null && (
                    <div>
                      <span className="text-muted-foreground">Validity:</span>
                      <span className="font-medium ml-2">{formatValidity(pack.validity_days)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p className="mb-2">Perfect for:</p>
                <ul className="space-y-1">
                  {qualityCosts.map((q) => (
                    <li key={q.quality}>• {Math.floor(pack.credits / Math.max(q.cost, 1))} x {q.quality} images</li>
                  ))}
                  {!!trainingCost && (
                    <li>• {Math.floor(pack.credits / Math.max(trainingCost, 1))} x LoRA trainings</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={() => onPurchase(pack)}
              disabled={isProcessing?.(pack.name) === true}
              className="w-full"
              variant={buttonVariant}
              size={buttonSize}
            >
              {isProcessing?.(pack.name) ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                `Buy ${pack.name}`
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}


