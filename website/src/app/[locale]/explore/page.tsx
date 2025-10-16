'use client';

import React, { useMemo, useCallback, Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ExploreThumb from '../components/ExploreThumb';
import { Button } from "@/components/ui/button";
import Footer from "@/app/components/sections/Footer";
import ContentPageHeader from '../components/ContentPageHeader';
import { exploreData, ExploreItem, styleFilters as styleFilterData } from '../data/exploreData';

// Dynamic filter generation from data
const getDynamicFilters = (data: ExploreItem[]): string[] => {
  const categories = new Set(data.map(item => item.category));
  return ["All", ...Array.from(categories).sort()];
};

function ExploreContent() {
  const styleFilters = useMemo(() => getDynamicFilters(exploreData), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get('style') || 'All';
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (activeFilter !== "All") {
      setIsVisible(false);
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [activeFilter, mounted]);

  const filteredData = useMemo(() => {
    if (activeFilter === "All") return exploreData;
    return exploreData.filter(item => item.category === activeFilter);
  }, [activeFilter]);

  const handleFilterChange = useCallback((filter: string) => {
    if (filter === activeFilter) return;
    const params = new URLSearchParams(searchParams.toString());
    if (filter === 'All') {
      params.delete('style');
    } else {
      params.set('style', filter);
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.push(`/explore${newUrl}`, { scroll: false });
  }, [activeFilter, router, searchParams]);

  return (
    <div className="min-h-screen text-white px-3">
      <ContentPageHeader 
        title="Showcase" 
        backgroundImage="/images/explore/Golden-Noir-01.png" 
      />
      <div className="w-full max-w-screen-xl mx-auto">  
        
        <div className="flex flex-col relative z-10">
          {/* Style Filters */}
          <div className="flex flex-wrap gap-1 justify-start px-0 sm:px-6 py-8 lg:py-12">
            {styleFilters.map(filter => (
                <Button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  variant="ghost"
                className={`relative px-6 h-12 rounded-2xl text-sm font-medium transition-all duration-200
                  ${activeFilter === filter
                      ? 'bg-mist text-black border-white hover:bg-mist hover:text-black'
                      : 'bg-mist/10 text-mist hover:bg-mist hover:text-black active:bg-white active:text-black'
                  }`}
                >
                  {filter}
                </Button>
            ))}
          </div>
           {/* Style Filters Content */}
          {activeFilter !== "All" && mounted && (
            <div className="py-8 sm:py-12 px-0 sm:px-6 border-t border-white/10">
                {activeFilter && styleFilterData[activeFilter] && (
                  <div key={activeFilter} className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                     <div className="flex flex-col">
                       <h2 className="text-xl font-semibold tracking-tight mb-4">
                         {styleFilterData[activeFilter].name}
                       </h2>
                       <p className="text-white/60 font-medium text-sm leading-tight">
                         {styleFilterData[activeFilter].description}
                       </p>
                     </div>
                     <div className="flex flex-row items-end justify-between sm:justify-end gap-4 w-full">
                       <div className="flex mr-4 text-white/80">
                        <div className="w-12 h-12 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
                            <path d="M2 10L10 2M2 10V14M2 10V6M10 2H14M10 2H6M10 18L18 10M10 18H6M10 18H14M18 10V6M18 10V14M2 14C2 14 2 15.0553 2 16.2222C2 17.204 2.79597 18 3.77781 18C4.94468 18 6 18 6 18M2 14L14 2M14 2H16.2222C17.2041 2 18 2.79594 18 3.77778V6M6 18L18 6M14 18H16.2222C17.2041 18 18 17.2041 18 16.2222V14M14 18L18 14M2 6V3.77778C2 2.79594 2.79594 2 3.77778 2H6M2 6L6 2" stroke="currentColor" strokeLinejoin="round"/>
                            <path d="M2.88867 17.1109L17.1109 2.88867" stroke="currentColor"/>
                          </svg>
                        </div>
                        <div className="w-12 h-12 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
                            <path d="M16.9835 2.88366L13.3335 1.66699C13.3335 2.55105 12.9823 3.39889 12.3572 4.02402C11.7321 4.64914 10.8842 5.00033 10.0002 5.00033C9.1161 5.00033 8.26825 4.64914 7.64313 4.02402C7.01801 3.39889 6.66682 2.55105 6.66682 1.66699L3.01682 2.88366C2.63964 3.00932 2.3198 3.26567 2.11503 3.60644C1.91027 3.94722 1.83405 4.34996 1.90016 4.74199L2.38349 7.63366C2.41522 7.82942 2.51572 8.00745 2.66694 8.13575C2.81816 8.26406 3.01017 8.33423 3.20849 8.33366H5.00016V16.667C5.00016 17.5837 5.75016 18.3337 6.66682 18.3337H13.3335C13.7755 18.3337 14.1994 18.1581 14.512 17.8455C14.8246 17.5329 15.0002 17.109 15.0002 16.667V8.33366H16.7918C16.9901 8.33423 17.1822 8.26406 17.3334 8.13575C17.4846 8.00745 17.5851 7.82942 17.6168 7.63366L18.1002 4.74199C18.1663 4.34996 18.09 3.94722 17.8853 3.60644C17.6805 3.26567 17.3607 3.00932 16.9835 2.88366Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                       </div>
                       <Button 
                         className="bg-ignite text-white hover:bg-white hover:text-black px-5 h-12 rounded-2xl font-medium"
                         onClick={() => window.location.href = styleFilterData[activeFilter].ctaLink}
                       >
                         Customise Style
                       </Button>
                     </div>
                   </div>
                 )}
             </div>
           )}
        </div>
          
        {/* Explore Grid */}
        <div className="w-full relative z-0">
          <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-2">
          {filteredData.map((item, index) => (
            <div
              key={`${item.id}-${activeFilter}`}
              className="inline-block align-top break-inside-avoid mb-2 w-full overflow-hidden"
            >
              <ExploreThumb
                image={item.image}
                aspectRatio={item.aspectRatio}
                resolution={item.resolution}
                model={item.model}
                prompt={item.prompt}
                category={item.category}
                staggerIndex={index}
                  totalItems={filteredData.length}
              />
            </div>
          ))}
          </div>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-20 text-white/50">
              No results found for &ldquo;{activeFilter}&rdquo;
            <button onClick={() => handleFilterChange("All")} className="mt-4 block">
              Show all styles
            </button>
          </div>
        )}
      </div>

     
      <Footer />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}