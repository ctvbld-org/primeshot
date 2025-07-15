import { SubscriptionsTable } from '@/components/subscriptions/subscriptions-table'
import { CreditPacksTable } from '@/components/subscriptions/credit-packs-table'
import { CreditCostsTable } from '@/components/subscriptions/credit-costs-table'

export default function SubscriptionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions Management</h1>
        <p className="text-muted-foreground">
          Manage subscription tiers, credit packs, and credit costs.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Subscription Tiers</h2>
          <SubscriptionsTable />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Credit Packs</h2>
          <CreditPacksTable />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Credit Costs</h2>
          <CreditCostsTable />
        </section>
      </div>
    </div>
  )
}