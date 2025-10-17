"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import Footer from "@primeshot/common/web/Footer";
import ContentPageHeader from "@/components/ContentPageHeader";
import { getWebsiteCdnUrl } from "@/lib/utils/cdn";
import { SubscriptionTier, PricingCategory, transformPricingData } from "@primeshot/common";

// Fallback pricing data for error states or loading
const fallbackPricingData: PricingCategory[] = [
  {
    category: "Credits",
    features: [
      {
        name: "Credits per month",
        basic: "40",
        standard: "180",
        pro: "450"
      },
      {
        name: "Price per credit",
        basic: "$0.22",
        standard: "$0.16",
        pro: "$0.13"
      }
    ]
  },
  {
    category: "Image",
    features: [
      {
        name: "Resolution",
        basic: "1K",
        standard: "Upto 4K",
        pro: "Upto 4K"
      },
      {
        name: "Takes per shoot",
        basic: "5",
        standard: "10",
        pro: "20"
      },
      
      {
        name: "Portrait aspect ratio",
        basic: "✓",
        standard: "✓",
        pro: "✓"
      },
      {
        name: "Square aspect ratio",
        basic: "",
        standard: "✓",
        pro: "✓"
      },
      {
        name: "Landscape aspect ratio",
        basic: "",
        standard: "",
        pro: "✓"
      }
    ]
  },
  {
    category: "Characters",
    features: [
      {
        name: "Included",
        basic: "1",
        standard: "1",
        pro: "3"
      },
      {
        name: "Storage",
        basic: "1",
        standard: "Upto 3",
        pro: "Upto 8"
      }
    ]
  },
  {
    category: "Generation",
    features: [
      {
        name: "Concurrent shoots",
        basic: "1",
        standard: "2",
        pro: "4"
      },
      {
        name: "Commercial use",
        basic: "✓",
        standard: "✓",
        pro: "✓"
      },
      {
        name: "Priority access to new features",
        basic: "",
        standard: "✓",
        pro: "✓"
      },
      {
        name: "Beta testing access",
        basic: "",
        standard: "",
        pro: "✓"
      }
    ]
  },
  {
    category: "Support",
    features: [
      {
        name: "Email support",
        basic: "✓",
        standard: "✓",
        pro: "✓"
      },
      {
        name: "Chat support",
        basic: "",
        standard: "✓",
        pro: "✓"
      },
      {
        name: "Dedicated support",
        basic: "",
        standard: "",
        pro: "✓"
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
const renderCellContent = (content: string) => {
  if (content === "✓") {
    return <CheckIcon />;
  }
  return content;
};

const faqs = [
  {
    id: "item-1",
    question: "What is a Character and how does it work?",
    answer: "A Character is your own custom AI model, trained from 9 selfies. It learns your exact facial features—structure, skin tone, hair—so every headshot looks authentically you. Depending on your plan, you get 1–3 Characters included. Additional Characters cost 30 credits each, and once created, you can reuse them anytime for new shoots in different outfits, scenes, and styles."
  },
  {
    id: "item-2",
    question: "How do credits work?",
    answer: "Credits are your balance for training Characters and generating images. Training a Character costs 30 credits. Image generation costs 1 credit for Basic (1K), 2 for Medium (2K), and 3 for High (4K) resolution. Your plan includes a monthly credit allowance that resets each billing cycle."
  },
  {
    id: "item-3",
    question: "Can I use my images commercially?",
    answer: "Yes. All images you generate are yours to use without restrictions—whether that's for LinkedIn, websites, marketing, or print."
  },
  {
    id: "item-4",
    question: "How do you protect my privacy and data?",
    answer: "Your photos and Characters are stored securely and never shared, sold, or used for our own training. You can delete individual Characters or your entire account anytime. No third-party access occurs without your consent."
  },
  {
    id: "item-5",
    question: "Can I change or cancel my plan?",
    answer: "Yes. You can upgrade or downgrade anytime in your account settings. Upgrades happen immediately with prorated billing; downgrades take effect at the next cycle. If you cancel, you'll keep access until the end of your current cycle. We store your data for 60 days so you can resubscribe without losing anything—after that, it's permanently deleted."
  },
  {
    id: "item-6",
    question: "Do unused credits roll over?",
    answer: "No. Credits expire at the end of each billing cycle, and your allowance resets."
  },
  {
    id: "item-7",
    question: "How can I get more credits?",
    answer: "You can upgrade your subscription for a higher monthly limit or purchase one-time credit packs from your account."
  },
  {
    id: "item-8",
    question: "What is your refund policy?",
    answer: "Subscriptions and credit packs are non-refundable. If there's a technical issue—like a failed generation—contact support for a review and possible credit adjustment."
  },
  {
    id: "item-9",
    question: "How do I delete my account?",
    answer: "In your account settings, select \"Delete Account\" to permanently remove all photos, Characters, and images. This is irreversible, so download anything you want to keep first."
  }
];

export default function PricingPage() {
  const { t } = useTranslation('pricing');
  const [activeTab, setActiveTab] = useState("monthly");
  const [pricingData, setPricingData] = useState<PricingCategory[]>(fallbackPricingData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPricingData() {
      try {
        const response = await fetch('/api/subscriptions');
        if (!response.ok) {
          throw new Error('Failed to fetch pricing data');
        }
        const subscriptions: SubscriptionTier[] = await response.json();
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

  return (
    <div className="min-h-screen text-white px-3">
       
      <ContentPageHeader 
        title="Pricing" 
        backgroundImage={getWebsiteCdnUrl('explore/blindlight-01.webp')} 
      />

      {/* Pricing Plans */}
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-screen-xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-6 px-6 py-8 lg:py-12 w-full">
            <div className="flex flex-col w-full md:w-1/2">
              <h2 className="text-xl font-semibold tracking-tight mb-2">Simple plans, endless looks.</h2>
              <p className="text-white/60 font-medium text-sm leading-tight">Cancel or switch anytime.</p>
            </div>
            <div className="flex w-full lg:w-1/2 flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-6">
              <p className="text-sm text-white">Save up to <span className="text-ignite">40%</span> on annual plans</p>
              <TabsList className="flex w-full sm:w-auto gap-1 bg-transparent">
                <TabsTrigger value="monthly" className="relative px-6 h-12 w-full rounded-2xl text-sm font-medium transition-all duration-200 data-[state=active]:bg-mist data-[state=active]:text-black data-[state=active]:border-white hover:bg-mist hover:text-black data-[state=inactive]:bg-mist/10 data-[state=inactive]:text-mist hover:bg-mist hover:text-black active:bg-white active:text-black">Monthly</TabsTrigger>
                <TabsTrigger value="annual" className="relative px-6 h-12 w-full rounded-2xl text-sm font-medium transition-all duration-200 data-[state=active]:bg-mist data-[state=active]:text-black data-[state=active]:border-white hover:bg-mist hover:text-black data-[state=inactive]:bg-mist/10 data-[state=inactive]:text-mist hover:bg-mist hover:text-black active:bg-white active:text-black">Annual</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="monthly" className="mt-0">
            <div className="bg-mist h-[500px] w-full rounded-2xl sm:rounded-3xl flex items-center justify-center">
              <p className="text-black text-xl font-medium">Monthly pricing content will go here</p>
            </div>
          </TabsContent>

          <TabsContent value="annual" className="mt-0">
            <div className="bg-mist h-[500px] w-full rounded-2xl sm:rounded-3xl flex items-center justify-center">
              <p className="text-black text-xl font-medium">Annual pricing content will go here</p>
            </div>
          </TabsContent>
        </Tabs>
        {/* Feature Comparison Table */}
          <div className="my-16 w-full max-w-screen-xl px-6 mx-auto">
            <div className="w-full border-b border-white/10"><div className="flex flex-col w-full sm:w-1/2 md:w-1/3">
              <h2 className="font-carb-bold text-4xl text-glacier mb-4">
                Compare plans
              </h2>
              <p className="text-white text-md leading-tight max-w-[400px]">
                Upgrade to unlock higher-resolution headshots, more credits, reusable Characters, and priority processing.
              </p>
            </div>
          </div>
            <Table className="w-full mt-12 border-collapse">
            <TableBody>
              {pricingData.map((category) => (
                <React.Fragment key={category.category}>
                  {/* Category Header */}
                  <TableRow className="h-16 border-none hover:bg-transparent">
                    <TableHead className="p-0 border-b border-[#102B34]/30 text-lg font-bold md:text-xl text-glacier w-1/4 md:w-1/2 leading-tight">{t(category.category)}</TableHead>
                    <TableHead className="p-3 text-sm font-bold w-1/4 md:w-1/6 text-white/40">Basic</TableHead>
                    <TableHead className="p-3 text-sm font-bold w-1/4 md:w-1/6 text-white/40"><span className="hidden sm:inline">Standard</span><span className="sm:hidden">Std</span></TableHead>
                    <TableHead className="p-3 text-small font-bold w-1/4 md:w-1/6 text-white/40">Pro</TableHead>
                  </TableRow>
                  

                  {/* Category Features */}
                  {category.features.map((feature, featureIndex) => (
                    <TableRow key={`${category.category}-${featureIndex}`} className="h-12 md:h-16 hover:bg-transparent border-none">
                      <TableCell className="p-0 border-b border-[#102B34]/30 text-sm md:text-lg text-white/60 w-1/4 md:w-1/2 pr-6 min-w-32">{t(feature.name)}</TableCell>
                      <TableCell className="p-3 text-sm md:text-lg text-mist bg-[#102B34]/30 w-1/4 md:w-1/6 border-none">{renderCellContent(feature.basic)}</TableCell>
                      <TableCell className="p-3 text-sm md:text-lg text-mist bg-[#102B34]/50 w-1/4 md:w-1/6 border-none">{renderCellContent(feature.standard)}</TableCell>
                      <TableCell className="p-3 text-sm md:text-lg text-mist bg-[#102B34]/70 w-1/4 md:w-1/6 border-none">{renderCellContent(feature.pro)}</TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>


      {/* FAQ Section */}
      <div className="w-full">
        <div className="w-full max-w-screen-xl mx-auto py-12 px-6 flex flex-col xl:flex-row gap-12">
          {/* Left side - Title and subtitle */}
          <div className="w-full xl:w-1/2 md:sticky xl:top-8 xl:self-start">
            <h2 className="font-carb-bold text-4xl text-glacier mb-4">
              Questions?
            </h2>
            <p className="text-white text-md leading-tight max-w-[300px]">
              Everything you need to know about our pricing and features
            </p>
          </div>

          {/* Right side - Accordion */}
          <div className="w-full xl:w-1/2">
            <Accordion
              type="single"
              collapsible
              className="w-full"
            >
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="border-white/10"
                >
                  <AccordionTrigger className="text-left text-white/70 hover:text-white data-[state=open]:text-glacier hover:no-underline py-3 md:py-6 text-sm md:text-lg font-medium transition-colors [&>svg]:ml-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-white text-sm md:text-lg pb-6 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      {/* Section 8 - Footer */}
      <Footer />
    </div>

  );
}
