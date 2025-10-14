"use client";
import Footer from '@primeshot/common/web/Footer';
import ContentPageHeader from '@/components/ContentPageHeader';
import { useTranslation } from 'react-i18next';

export default function Privacy() {
  const { t } = useTranslation('legal');
  const useItems = (t('privacy.sections.use.items', { returnObjects: true }) as unknown as string[]) || [];
  const securityItems = (t('privacy.sections.security.items', { returnObjects: true }) as unknown as string[]) || [];
  const rightsItems = (t('privacy.sections.rights.items', { returnObjects: true }) as unknown as string[]) || [];
  return (
    <div className="w-full min-h-screen text-white px-3">
      <ContentPageHeader 
          title={t('privacy.title')}
          backgroundImage=""
        />
      <div className="max-w-3xl text-sm mx-auto space-y-8 pb-40">
        <div className='w-full pt-40 pb-20'>
            <h1 className="font-carb-bold text-glacier text-7xl mb-4">{t('privacy.title')}</h1>
            <p className="text-whiter">{t('common.effectiveDate', { date: '12 September 2025' })}</p>
        </div>
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
      <Footer />
    </div>
  );
}
