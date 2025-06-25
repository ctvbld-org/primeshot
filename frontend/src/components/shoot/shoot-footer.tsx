import { Button } from "@/components/ui/button"
import styles from './shoot-footer.module.css'
import { Icon } from "../icons/icon"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from 'react-i18next'
import { getStripe, createCheckoutSession } from '@/lib/stripe';
import { calculatePricing } from '@/lib/pricing';
import { getOrCreateDraftOrder } from '@/lib/api/orders';
import { useUserProgress } from '@/lib/hooks/use-user-progress';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from "@/components/ui/use-toast"
import { createClient } from '@/lib/supabase/client';
import { cn } from "@/lib/utils"

interface ScrollState {
  atStart: boolean
  atEnd: boolean
  noScroll: boolean
}

interface ShootFooterProps {
  stylesCount: number
  photosPerStyle: number
  basePrice: number
  extraStylesCount: number
  totalPhotosWithExtra: number
  upgradedPrice: number
  onCheckout?: () => Promise<void>
}

export function ShootFooter({
  stylesCount,
  photosPerStyle,
  basePrice,
  extraStylesCount,
  totalPhotosWithExtra,
  upgradedPrice,
  onCheckout
}: ShootFooterProps) {
  const totalPhotos = stylesCount * photosPerStyle
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation(['styles', 'payment'])
  const { user } = useAuth()
  const { toast } = useToast()
  const wrapperRef = useRef<HTMLDivElement>(null)
  
  // 2. State
  const [scrollState, setScrollState] = useState<ScrollState>({
    atStart: true,
    atEnd: false,
    noScroll: true
  })

  const checkScroll = useCallback(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const { scrollLeft, scrollWidth, clientWidth } = wrapper
    const hasScroll = scrollWidth > clientWidth

    setScrollState({
      atStart: scrollLeft === 0,
      atEnd: Math.abs(scrollWidth - clientWidth - scrollLeft) < 1,
      noScroll: !hasScroll
    })
  }, [])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    // Check initial state
    checkScroll()

    // Add scroll listener
    wrapper.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      wrapper.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  const handleCheckout = async () => {
    if (stylesCount === 0 || !user) return;
    
    setLoading(true);
    try {
      // Get or create draft order
      const order = await getOrCreateDraftOrder(user.id);
      if (!order) throw new Error(t('errors.orderNotFound', { ns: 'payment' }));

      // Get existing styles
      const supabase = createClient();
      const { data: styles, error: stylesError } = await supabase
        .from('styles')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'draft');

      console.log('Found styles:', { styles, error: stylesError });

      if (stylesError) {
        console.error('Error fetching styles:', stylesError);
        throw new Error('Failed to fetch styles');
      }

      if (!styles || styles.length === 0) {
        throw new Error('No styles found to process');
      }

      // Update styles with order_id
      const { error: updateError } = await supabase
        .from('styles')
        .update({ order_id: order.id })
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .in('id', styles.map(s => s.id));

      if (updateError) {
        console.error('Error updating styles:', updateError);
        throw new Error('Failed to update styles');
      }
      console.log('Successfully associated styles with order:', order.id);

      // Verify styles were associated
      const { data: verifyStyles, error: verifyError } = await supabase
        .from('styles')
        .select('*')
        .eq('order_id', order.id);

      if (verifyError) {
        console.error('Error verifying styles:', verifyError);
      } else {
        console.log('Verified styles after update:', verifyStyles);
      }

      // Calculate pricing
      const pricing = calculatePricing(stylesCount);
      
      // Create checkout session
      const checkoutInfo = await createCheckoutSession({
        orderId: order.id,
        amount: pricing.price,
        metadata: {
          tier: pricing.tier,
          styleCount: stylesCount.toString(),
          totalHeadshots: pricing.totalHeadshots.toString()
        },
        customerEmail: user.email
      });

      if (!checkoutInfo || !checkoutInfo.sessionId) {
        throw new Error(t('errors.paymentClientSecret', { ns: 'payment' }));
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      await stripe.redirectToCheckout({
        sessionId: checkoutInfo.sessionId
      });
    } catch (error) {
      console.error('Error preparing payment:', error);
      toast({
        title: t('status.error', { ns: 'payment' }),
        description: error instanceof Error ? error.message : t('errors.unexpectedError', { ns: 'payment' }),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.countWrapper}>
          <span className={cn(styles.count, stylesCount >= 1 && styles.countActive)}>
            {stylesCount}
          </span>
          <p className={styles.countLabel}>
            {t('footer.styles.label', { count: stylesCount })}
          </p>
        </div>
        
        <span className={styles.separator} />

        <div className={styles.info}>
          <div 
            ref={wrapperRef}
            className={cn(
              styles.infoWrapper,
              'hide-scrollbar',
              scrollState.atStart && styles.atStart,
              scrollState.atEnd && styles.atEnd,
              scrollState.noScroll && styles.noScroll
            )}
          >
            {stylesCount > 0 ? (
              <>
                <div className={styles.infoContent}>
                  <div className={styles.infoHeadshot}>
                    <span className={styles.headshotIcon}>
                      <Icon variant="camera" size={14} />
                      <span>{t('footer.headshots.count', { count: totalPhotos })}</span>
                    </span>
                    <span className="text-[#ffffff]"> {t('footer.headshots.label', { count: totalPhotos })}</span>
                    <span className={styles.photosPerStyle}>{t('footer.headshots.perStyle', { count: photosPerStyle })}</span>
                  </div>
                  <div className={styles.upgradeContainer}>
                    <div className={`${styles.upgrade} flex flex-nowrap flex-[0_0_auto]`}>
                      <Icon variant="plusFill" size={16} className="flex-[1_0_auto] text-[#44E3C9]" />
                      <span className="flex flex-nowrap flex-[1_0_auto]">{t('footer.upgrade.text', { count: extraStylesCount })}</span>
                      <span className="text-[#FFFFFF]">{totalPhotosWithExtra}</span>
                      <span className="flex flex-nowrap flex-[1_0_auto]">{t('footer.upgrade.photosText')}</span>
                      <span className="text-[#FFFFFF] flex flex-nowrap flex-[1_0_auto]">{t('footer.upgrade.price', { amount: upgradedPrice })}</span>
                    </div>

                    <span className={styles['price-badge']}>
                      <span className={styles.currency}>US$</span>
                      {basePrice / 100 }
                    </span>
                  </div>
                </div>  
              </>
            ) : (
              <>
                <div className="flex items-center mr-10 flex-nowrap flex-[1_1_80%] text-[14px]">
                  <Icon variant="dizzyFace" size={22} className="mr-2" />
                  <div className={styles['footer-content']}>
                    <span>{t('footer.emptyState')}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <Button 
          onClick={handleCheckout}
          variant="primary"
          className={styles.checkoutButton}
          disabled={stylesCount === 0 || loading}
          loading={loading}
        >
          {t('footer.checkout')}
          <span className={styles.buttonPrice}>US$ {basePrice / 100 }</span>
        </Button>
      </div>
    </div>
  )
} 