import Footer from '@primeshot/common/web/Footer';
import { initServerI18n } from '@primeshot/common';
import ContentPageHeader from '@/components/ContentPageHeader';

interface TermsProps {
  params: Promise<{ locale: string }>;
}

export default async function Terms({ params }: TermsProps) {
  const { locale } = await params;
  const i18n = initServerI18n(locale);
  const t = i18n.getFixedT(locale, 'legal');
  
  const userAccountItems = (t('terms.sections.userAccounts.items', { returnObjects: true }) as unknown as string[]) || [];
  const prohibitedItems = (t('terms.sections.prohibitedContent.items', { returnObjects: true }) as unknown as string[]) || [];
  
  return (
    <div className="w-full min-h-screen px-3 text-white">
      <ContentPageHeader 
        title={t('terms.title')}
        backgroundImage=""
      />
      <div className="w-full max-w-screen-xl mx-auto">
        <div className="max-w-3xl px-6 text-sm space-y-8 py-8 xl:py-16">
          <p className="text-white/60">{t('common.effectiveDate', { date: '12 September 2025' })}</p>
        
          <p>
            {t('terms.intro')}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('terms.sections.definitions.title')}</h2>
            <ul className="list-disc list-inside space-y-1 text-white/80">
              <li>{t('terms.sections.definitions.items.service')}</li>
              <li>{t('terms.sections.definitions.items.user')}</li>
              <li>{t('terms.sections.definitions.items.userContent')}</li>
              <li>{t('terms.sections.definitions.items.aiGenerated')}</li>
              <li>{t('terms.sections.definitions.items.credits')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('terms.sections.eligibility.title')}</h2>
            <p className="text-white/80">
              {t('terms.sections.eligibility.content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('terms.sections.userAccounts.title')}</h2>
            <ul className="list-disc list-inside space-y-1 text-white/80">
              {userAccountItems.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('terms.sections.payments.title')}</h2>
            <p className="text-white/80">
              {t('terms.sections.payments.content')}
            </p>
            <h3 className="text-xl font-semibold">{t('terms.sections.payments.refundsTitle')}</h3>
            <p className="text-white/80">
              {t('terms.sections.payments.refunds')}
            </p>
            <h3 className="text-xl font-semibold">{t('terms.sections.payments.priceChangesTitle')}</h3>
            <p className="text-white/80">
              {t('terms.sections.payments.priceChanges')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('terms.sections.ownership.title')}</h2>
            <p className="text-white/80">
              {t('terms.sections.ownership.content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('terms.sections.prohibitedContent.title')}</h2>
            <p className="text-white/80">
              {t('terms.sections.prohibitedContent.intro')}
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/80">
              {prohibitedItems.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
            <p className="text-white/80">
              {t('terms.sections.prohibitedContent.note')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('terms.sections.aiGenerated.title')}</h2>
            <p className="text-white/80">
              {t('terms.sections.aiGenerated.content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('terms.sections.privacy.title')}</h2>
            <p className="text-white/80">
              {t('terms.sections.privacy.content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('terms.sections.ip.title')}</h2>
            <p className="text-white/80">
              {t('terms.sections.ip.content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('terms.sections.liability.title')}</h2>
            <p className="text-white/80">
              {t('terms.sections.liability.content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('terms.sections.indemnity.title')}</h2>
            <p className="text-white/80">
              {t('terms.sections.indemnity.content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('terms.sections.termination.title')}</h2>
            <p className="text-white/80">
              {t('terms.sections.termination.content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('terms.sections.law.title')}</h2>
            <p className="text-white/80">
              {t('terms.sections.law.content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('terms.sections.changes.title')}</h2>
            <p className="text-white/80">
              {t('terms.sections.changes.content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('terms.sections.misc.title')}</h2>
            <ul className="list-disc list-inside space-y-1 text-white/80">
              <li>{t('terms.sections.misc.items.severability')}</li>
              <li>{t('terms.sections.misc.items.entireAgreement')}</li>
              <li>{t('terms.sections.misc.items.contact')} <a href="mailto:team@primeshot.ai" className="text-glacier hover:underline">{t('common.email')}</a>.</li>
            </ul>
          </section>
          <div className='w-full pt-16 text-right'><h1 className="font-carb-bold text-white/20 text-7xl">{t('common.endMarker')}</h1></div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
