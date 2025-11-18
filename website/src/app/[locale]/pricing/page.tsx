"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@primeshot/common/web/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@primeshot/common/web/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@primeshot/common/web/ui/tabs";
import { Button } from "@primeshot/common/web/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@primeshot/common/web/ui/dialog";
import ContentPageHeader from "@/components/ContentPageHeader";
import { getWebsiteCdnUrl } from "@primeshot/common/lib/utils/cdn";
import { PricingCategory, transformPricingData, getApiUrl, SubscriptionTier } from "@primeshot/common";
import { PricingCards, SpecialOfferBanner, SignInForm } from "@primeshot/common/web";
import { STRIPE_REFERENCE } from "@primeshot/common/lib/stripe/stripe-reference";
import { getStripeEnv } from "@primeshot/common/lib/stripe/env";
import { toast } from "sonner";
import { useAuth } from "@primeshot/common/hooks/AuthContext";
import styles from './page.module.css';
import { VisuallyHidden } from '@primeshot/common/web/ui/dialog';

// Fallback pricing data for error states or loading
const fallbackPricingData: PricingCategory[] = [
  {
    category: "Credits",
    features: [
      {
        name: "Credits per month",
        free: "-",
        basic: "-",
        standard: "-",
        pro: "-",
        ultimate: "-"
      },
      {
        name: "Price per credit",
        free: "-",
        basic: "-",
        standard: "-",
        pro: "-",
        ultimate: "-"
      }
    ]
  },
  {
    category: "Image",
    features: [
      {
        name: "Resolution",
        free: "-",
        basic: "Basic quality",
        standard: "High quality",
        pro: "High quality",
        ultimate: "High quality"
      },      
      {
        name: "Portrait aspect ratio",
        free: "✓",
        basic: "✓",
        standard: "✓",
        pro: "✓",
        ultimate: "✓"
      },
      {
        name: "Square aspect ratio",
        free: "✓",
        basic: "✓",
        standard: "✓",
        pro: "✓",
        ultimate: "✓"
      },
      {
        name: "Landscape aspect ratio",
        free: "✓",
        basic: "✓",
        standard: "✓",
        pro: "✓",
        ultimate: "✓"
      }
    ]
  },
  {
    category: "Characters",
    features: [
      {
        name: "Included",
        free: "1",
        basic: "1",
        standard: "1",
        pro: "3",
        ultimate: "10"
      },
      {
        name: "Storage",
        free: "1",
        basic: "1",
        standard: "Upto 3",
        pro: "Upto 8",
        ultimate: "Upto 20"
      }
    ]
  },
  {
    category: "Generation",
    features: [
      {
        name: "Concurrent shoots",
        free: "1",
        basic: "1",
        standard: "2",
        pro: "4",
        ultimate: "8"
      },
      {
        name: "Commercial use",
        free: "",
        basic: "✓",
        standard: "✓",
        pro: "✓",
        ultimate: "✓"
      },
      {
        name: "Priority access to new features",
        free: "",
        basic: "",
        standard: "✓", 
        pro: "✓",
        ultimate: "✓"
      },
      {
        name: "Premium styles",
        free: "",
        basic: "",
        standard: "✓",
        pro: "✓",
        ultimate: "✓"
      },
      {
        name: "Beta testing access",
        free: "",
        basic: "",
        standard: "",
        pro: "✓",
        ultimate: "✓"
      }
    ]
  },
  {
    category: "Support",
    features: [
      {
        name: "Email support",
        free: "",
        basic: "✓",
        standard: "✓",
        pro: "✓",
        ultimate: "✓"
      },
      {
        name: "Chat support",
        free: "",
        basic: "",
        standard: "✓",
        pro: "✓",
        ultimate: "✓"
      },
      {
        name: "Dedicated support",
        free: "",
        basic: "",
        standard: "",
        pro: "✓",
        ultimate: "✓"
      }
    ]
  }
];

// CheckIcon Component
const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.998 5.00586C16.3398 4.66464 16.8938 4.66434 17.2354 5.00586C17.5769 5.34738 17.5766 5.90145 17.2354 6.24316L9.00879 14.4697C8.52066 14.9578 7.72934 14.9578 7.24121 14.4697L2.76465 9.99316C2.42344 9.65145 2.42314 9.09739 2.76465 8.75586C3.10617 8.41434 3.66023 8.41464 4.00195 8.75586L7.59473 12.3477C7.88762 12.6405 8.36239 12.6405 8.65527 12.3477L15.998 5.00586Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5"/>
  </svg>
);

// Helper function to render cell content
const renderCellContent = (content: string, t: any) => {
  if (content === "✓") {
    return <CheckIcon />;
  }
  // Check if content is a translation key
  if (content.startsWith('comparisonTable.')) {
    return t(content);
  }
  return content;
};

export default function PricingPage() {
  const { t } = useTranslation('pricing');
  const [activeTab, setActiveTab] = useState<"monthly" | "yearly">("monthly");
  const [pricingData, setPricingData] = useState<PricingCategory[]>(fallbackPricingData);
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [pendingTier, setPendingTier] = useState<SubscriptionTier | null>(null);
  const isSpecialOffer = true; // TODO: Remove when special offer ends
  const { user } = useAuth();

  // Define FAQs with translations
  const faqs = [
    {
      id: "item-1",
      question: t('page.faq.items.character.question'),
      answer: t('page.faq.items.character.answer')
    },
    {
      id: "item-2",
      question: t('page.faq.items.credits.question'),
      answer: t('page.faq.items.credits.answer')
    },
    {
      id: "item-3",
      question: t('page.faq.items.commercial.question'),
      answer: t('page.faq.items.commercial.answer')
    },
    {
      id: "item-4",
      question: t('page.faq.items.privacy.question'),
      answer: t('page.faq.items.privacy.answer')
    },
    {
      id: "item-5",
      question: t('page.faq.items.changePlan.question'),
      answer: t('page.faq.items.changePlan.answer')
    },
    {
      id: "item-6",
      question: t('page.faq.items.rollover.question'),
      answer: t('page.faq.items.rollover.answer')
    },
    {
      id: "item-7",
      question: t('page.faq.items.moreCredits.question'),
      answer: t('page.faq.items.moreCredits.answer')
    },
    {
      id: "item-8",
      question: t('page.faq.items.refund.question'),
      answer: t('page.faq.items.refund.answer')
    },
    {
      id: "item-9",
      question: t('page.faq.items.deleteAccount.question'),
      answer: t('page.faq.items.deleteAccount.answer')
    }
  ];

  useEffect(() => {
    async function fetchPricingData() {
      try {
        const response = await fetch(getApiUrl('/api/subscriptions'));
        if (!response.ok) {
          throw new Error('Failed to fetch pricing data');
        }
        const subscriptions: SubscriptionTier[] = await response.json();
        setSubscriptionTiers(subscriptions);
        const transformedData = transformPricingData(subscriptions);
        
        if (transformedData.length > 0) {
          setPricingData(transformedData);
        }
      } catch (err) {
        console.error('Error fetching pricing data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load pricing');
        // Keep fallback data on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchPricingData();
  }, []);

  // Fetch current subscription if user is logged in
  useEffect(() => {
    async function fetchCurrentSubscription() {
      if (!user) {
        setCurrentSubscription(null);
        return;
      }

      try {
        const res = await fetch(getApiUrl('/api/subscription/current'), {
          credentials: 'include',
        });

        if (res.ok) {
          const subscription = await res.json();
          setCurrentSubscription(subscription);
        }
      } catch (err) {
        console.error('Error fetching current subscription:', err);
      }
    }

    fetchCurrentSubscription();
  }, [user]);

  // Get Stripe price ID for a subscription tier
  const getStripePriceId = (tierName: string, billingCycle: 'monthly' | 'yearly'): string | null => {
    const env = getStripeEnv()
    const stripeConfig = STRIPE_REFERENCE[env]
    
    const tierConfig = stripeConfig.subscriptions[tierName as keyof typeof stripeConfig.subscriptions]
    if (!tierConfig) return null
    
    return billingCycle === 'yearly' ? tierConfig.yearly || tierConfig.monthly : tierConfig.monthly
  }

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    // If user is not logged in, show sign in modal
    if (!user) {
      setPendingTier(tier);
      setShowSignInModal(true);
      return;
    }

    // Proceed with checkout
    await createCheckoutSession(tier);
  }

  const createCheckoutSession = async (tier: SubscriptionTier) => {
    setPurchaseLoading(true)
    
    try {
      // Get Stripe price ID based on tier name and billing cycle
      const priceId = getStripePriceId(tier.name, activeTab)
      
      if (!priceId) {
        toast.error('Invalid plan selected. Please try again.')
        return
      }

      // Create checkout session via rewrite proxy to webapp API
      const res = await fetch(getApiUrl('/api/payment/subscription-checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for CORS with credentials
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/create`,
          cancelUrl: `${window.location.origin}/pricing`,
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }
      
      const result = await res.json()
      
      if (result.url) {
        // Redirect to Stripe checkout
        window.location.href = result.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout. Please try again.')
    } finally {
      setPurchaseLoading(false)
    }
  }

  // Handle successful sign in - proceed with pending checkout
  useEffect(() => {
    if (user && pendingTier && showSignInModal) {
      setShowSignInModal(false);
      // Wait a bit for auth state to fully update
      setTimeout(async () => {
        await createCheckoutSession(pendingTier);
        setPendingTier(null);
      }, 500);
    }
  }, [user, pendingTier, showSignInModal]);

  // Determine current plan name
  const currentPlanName = currentSubscription?.status === 'active' 
    ? currentSubscription.plan_name 
    : null;

  return (
    <>
    <div className={styles.container}>
       
      <ContentPageHeader 
        title={t('page.title')}
        backgroundImage={getWebsiteCdnUrl('/blindlight-01.webp')} 
      >
        {/* Special Offer Banner inside ContentPageHeader */}
        {isSpecialOffer && !isLoading && <SpecialOfferBanner className={styles.specialOfferBanner} />}
      </ContentPageHeader>

      {/* Pricing Plans */}
      <div className={styles.tabsWrapper}>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "monthly" | "yearly")} className={styles.tabsWrapper}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <h2 className={styles.headerTitle}>{t('page.header.title')}</h2>
              <p className={styles.headerSubtitle}>{t('page.header.subtitle')}</p>
            </div>
            <div className={styles.headerRight}>
              <p className={styles.savingsText}>{t('page.header.savingsText')} <span className={styles.savingsHighlight}>70%</span> {t('page.header.savingsOn')}</p>
              <TabsList className={styles.tabsList}>
                <TabsTrigger value="monthly" className={styles.tabTrigger}>{t('page.tabs.monthly')}</TabsTrigger>
                <TabsTrigger value="annual" className={styles.tabTrigger}>{t('page.tabs.annual')}</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="monthly" className="mt-0">
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <p className={styles.loadingText}>{t('page.loading')}</p>
              </div>
            ) : (
              <div className={styles.contentWrapper}>
                <PricingCards
                  billingCycle="monthly"
                  tiers={subscriptionTiers}
                  currentPlan={currentPlanName}
                  loading={purchaseLoading}
                  onSelectPlan={handleSelectPlan}
                  renderButton={(tier, isCurrentPlan) => (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleSelectPlan(tier)}
                      disabled={purchaseLoading || isCurrentPlan}
                      className={styles.selectPlanButton}
                    >
                      {purchaseLoading 
                        ? t('page.buttons.processing')
                        : isCurrentPlan 
                        ? t('page.buttons.currentPlan')
                        : !user 
                        ? t('page.buttons.getStarted')
                        : t('page.buttons.selectPlan')}
                    </Button>
                  )}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="annual" className="mt-0">
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <p className={styles.loadingText}>{t('page.loading')}</p>
              </div>
            ) : (
              <div className={styles.contentWrapper}>
                <PricingCards
                  billingCycle="yearly"
                  tiers={subscriptionTiers}
                  currentPlan={currentPlanName}
                  loading={purchaseLoading}
                  onSelectPlan={handleSelectPlan}
                  renderButton={(tier, isCurrentPlan) => (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleSelectPlan(tier)}
                      disabled={purchaseLoading || isCurrentPlan}
                      className={styles.selectPlanButton}
                    >
                      {purchaseLoading 
                        ? t('page.buttons.processing')
                        : isCurrentPlan 
                        ? t('page.buttons.currentPlan')
                        : !user 
                        ? t('page.buttons.getStarted')
                        : t('page.buttons.selectPlan')}
                    </Button>
                  )}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
        {/* Feature Comparison Table */}
          <div className={styles.featureComparison}>
            <div className={styles.comparisonHeader}>
              <div className={styles.comparisonHeaderContent}>
                <h2 className={styles.comparisonTitle}>
                  {t('page.comparison.title')}
                </h2>
                <p className={styles.comparisonDescription}>
                  {t('page.comparison.description')}
                </p>
              </div>
            </div>
            <Table className={styles.table}>
            <TableBody>
              {pricingData.map((category) => (
                <React.Fragment key={category.category}>
                  {/* Category Header */}
                  <TableRow className={styles.categoryRow}>
                    <TableHead className={styles.categoryHeader}>{t(category.category)}</TableHead>
                    <TableHead className={styles.tierHeader}>Free</TableHead>
                    <TableHead className={styles.tierHeader}>Basic</TableHead>
                    <TableHead className={styles.tierHeader}>
                      <span className={styles.tierHeaderStandardHidden}>Standard</span>
                      <span className={styles.tierHeaderStandardVisible}>Std</span>
                    </TableHead>
                    <TableHead className={styles.tierHeader}>Pro</TableHead>
                    <TableHead className={styles.tierHeader}>Ultimate</TableHead>
                  </TableRow>
                  

                  {/* Category Features */}
                  {category.features.map((feature, featureIndex) => (
                    <TableRow key={`${category.category}-${featureIndex}`} className={styles.featureRow}>
                      <TableCell className={styles.featureName}>{t(feature.name)}</TableCell>
                      <TableCell className={styles.featureValueFree}>{renderCellContent(feature.free, t)}</TableCell>
                      <TableCell className={styles.featureValueBasic}>{renderCellContent(feature.basic, t)}</TableCell>
                      <TableCell className={styles.featureValueStandard}>{renderCellContent(feature.standard, t)}</TableCell>
                      <TableCell className={styles.featureValuePro}>{renderCellContent(feature.pro, t)}</TableCell>
                      <TableCell className={styles.featureValueUltimate}>{renderCellContent(feature.ultimate, t)}</TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>


      {/* FAQ Section */}
      <div className={styles.faqSection}>
        <div className={styles.faqContainer}>
          {/* Left side - Title and subtitle */}
          <div className={styles.faqLeft}>
            <h2 className={styles.faqTitle}>
              {t('page.faq.title')}
            </h2>
            <p className={styles.faqSubtitle}>
              {t('page.faq.subtitle')}
            </p>
          </div>

          {/* Right side - Accordion */}
          <div className={styles.faqRight}>
            <Accordion
              type="single"
              collapsible
              className={styles.faqAccordion}
            >
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className={styles.faqItem}
                >
                  <AccordionTrigger className={styles.faqTrigger}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className={styles.faqContent}>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>

    {/* Sign In Modal */}
    <Dialog open={showSignInModal} onOpenChange={(open) => {
      setShowSignInModal(open);
      if (!open) setPendingTier(null);
    }}>
      <DialogContent>
        <DialogHeader>
          <VisuallyHidden><DialogTitle>{t('page.signIn.modalTitle')}</DialogTitle></VisuallyHidden>
        </DialogHeader>
        <SignInForm />
      </DialogContent>
    </Dialog>
    </>
  );
}
