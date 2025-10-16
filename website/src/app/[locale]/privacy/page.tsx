import Footer from '@primeshot/common/web/Footer';
import ContentPageHeader from '@/components/ContentPageHeader';
import { initServerI18n } from '@primeshot/common';

interface PrivacyProps {
  params: Promise<{ locale: string }>;
}

export default async function Privacy({ params }: PrivacyProps) {
  const { locale } = await params;
  const i18n = initServerI18n(locale);
  const t = i18n.getFixedT(locale, 'legal');
  
  const useItems = (t('privacy.sections.use.items', { returnObjects: true }) as unknown as string[]) || [];
  const securityItems = (t('privacy.sections.security.items', { returnObjects: true }) as unknown as string[]) || [];
  const rightsItems = (t('privacy.sections.rights.items', { returnObjects: true }) as unknown as string[]) || [];
  
  return (
    <div className="w-full min-h-screen text-white px-3">
      <ContentPageHeader 
        title={t('privacy.title')}
        backgroundImage=""
      />
      <div className="w-full max-w-screen-xl mx-auto">
        <div className="max-w-3xl px-6 text-sm space-y-8 py-8 xl:py-16">
          <p className="text-white/60">{t('common.effectiveDate', { date: '12 September 2025' })}</p>   
          <p>
            {t('privacy.intro')}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('privacy.sections.collect.title')}</h2>
            <ul className="list-disc list-inside space-y-1 text-white/80">
              <li>{t('privacy.sections.collect.items.account')}</li>
              <li>{t('privacy.sections.collect.items.userContent')}</li>
              <li>{t('privacy.sections.collect.items.device')}</li>
            </ul>
            <p className="text-white/80 font-medium">
              {t('privacy.sections.collect.note')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('privacy.sections.use.title')}</h2>
            <p className="text-white/80">
              {t('privacy.sections.use.intro')}
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/80">
              {useItems.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
            <p className="text-white/80">
              {t('privacy.sections.use.note')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('privacy.sections.thirdParty.title')}</h2>
            <ul className="list-disc list-inside space-y-1 text-white/80">
              <li>{t('privacy.sections.thirdParty.items.aws')}</li>
              <li>{t('privacy.sections.thirdParty.items.stripe')}</li>
            </ul>
            <p className="text-white/80">
              {t('privacy.sections.thirdParty.note')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('privacy.sections.cookies.title')}</h2>
            <p className="text-white/80">
              {t('privacy.sections.cookies.content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('privacy.sections.retention.title')}</h2>
            <p className="text-white/80">
              {t('privacy.sections.retention.content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('privacy.sections.security.title')}</h2>
            <p className="text-white/80">
              {t('privacy.sections.security.intro')}
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/80">
              {securityItems.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('privacy.sections.rights.title')}</h2>
            <p className="text-white/80">
              {t('privacy.sections.rights.intro')}
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/80">
              {rightsItems.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
            <p className="text-white/80">
              {t('privacy.sections.rights.contact', { email: t('common.email') })}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('privacy.sections.children.title')}</h2>
            <p className="text-white/80">
              {t('privacy.sections.children.content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('privacy.sections.changes.title')}</h2>
            <p className="text-white/80">
              {t('privacy.sections.changes.content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t('privacy.sections.contact.title')}</h2>
            <p className="text-white/80">
              {t('privacy.sections.contact.content', { email: t('common.email') })}
            </p>
          </section>
          <div className='w-full pt-16 text-right'><h1 className="font-carb-bold text-white/20 text-7xl">{t('common.endMarker')}</h1></div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
