import Image from "next/image";
import Link from "next/link";
import { initServerI18n } from '@primeshot/common';
import WaitlistForm from "@/components/WaitlistForm";
import SocialIcons from "@/components/SocialIcons";
import { WebGLBackground, TransitionButton } from "@/components/WebGLBackground";
import { HomePageWrapper } from "@/components/HomePageWrapper";

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  const i18n = initServerI18n(locale);
  const t = i18n.getFixedT(locale, 'homepage');
  
  const allTransitionImages = [
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-1-w1920.webp` : '/website-images/landing-page-1-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-2-w1920.webp` : '/website-images/landing-page-2-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-3-w1920.webp` : '/website-images/landing-page-3-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-4-w1920.webp` : '/website-images/landing-page-4-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-5-w1920.webp` : '/website-images/landing-page-5-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-6-w1920.webp` : '/website-images/landing-page-6-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-12-w1920.webp` : '/website-images/landing-page-7-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-8-w1920.webp` : '/website-images/landing-page-8-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-9-w1920.webp` : '/website-images/landing-page-9-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-10-w1920.webp` : '/website-images/landing-page-10-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-13-w1920.webp` : '/website-images/landing-page-10-w1920.webp',
    process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/landing-page-15-w1920.webp` : '/website-images/landing-page-10-w1920.webp',
  ];

  // Shuffle the images randomly on each page load
  const transitionImages = [...allTransitionImages].sort(() => Math.random() - 0.5);

  return (
    <HomePageWrapper>
      <main className="relative w-full min-h-screen">
        <WebGLBackground images={transitionImages} />
      
      {/* Content overlay */}
      <div 
        className="relative z-10 flex flex-col md:flex-row w-full mix-blend-lighten justify-between min-h-screen h-full overflow-y-auto">
        {/* Left side - scrollable */}
        <div className="relative bg-gradient-to-b from-abyss to-obsidian flex h-full min-h-dvh md:h-auto md:min-h-0 flex-col w-full md:w-1/2 lg:w-1/3 lg:min-w-[420px] justify-end p-4 sm:p-8 pb-16 sm:pb-16 lg:p-12 lg:pb-20">
          
          {/* Cross SVGs in corners */}
          <Image src="/cross.svg" alt="" width={24} height={24} className="absolute top-4 left-4 sm:top-8 sm:left-8 w-5 h-5" />
          <Image src="/cross.svg" alt="" width={24} height={24} className="absolute top-4 right-4 sm:top-8 sm:right-8 w-5 h-5" />
          <Image src="/cross.svg" alt="" width={24} height={24} className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 w-5 h-5" />
          <Image src="/cross.svg" alt="" width={24} height={24} className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 w-5 h-5" />
          <div className="space-y-8 pt-16">
            <Link href="/" className="select-none">
              <Image src={(process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/assets/logo-primeshot.svg` : '/app-images/assets/logo-primeshot.svg')} alt="Primeshot" width={64} height={64} className="w-16 h-16 animate-fade-in-up-delay-1" />
            </Link>
              
            <div className="flex flex-col space-y-8 max-w-xs">
              <h1 className="text-[60px] font-normal font-carb text-mist tracking-tight leading-[0.8] animate-fade-in-up-delay-2">
                {t('hero.headline')}
              </h1>
              
              <div className="text-sm flex flex-col gap-2">
                <p 
                  className="font-regular text-frost animate-fade-in-up-delay-3" 
                  dangerouslySetInnerHTML={{
                    __html: t('hero.tagline', {
                      ai: '<span class="text-glacier font-medium px-1 py-0.5 bg-glacier/10 rounded-sm">AI</span>',
                      period: '<span class="font-medium">Period.</span>'
                    })
                  }} 
                />
                <p className="font-medium leading-[1.2] text-frost/60 animate-fade-in-up-delay-4">{t('hero.subtitle')}</p>
              </div>
            </div>
            
            <WaitlistForm className="animate-fade-in-up-delay-4"/>
          </div>
          
        </div>
        
        {/* Right side - fixed */}
        <div className="flex flex-col h-full min-h-dvh md:h-auto md:min-h-0 w-full md:w-1/2 lg:w-1/3 p-4 pb-2 sm:p-8 sm:pb-6 lg:p-12 lg:pb-6 items-end justify-end space-y-8">
          
          <div className="flex flex-col flex-1 select-none">
            <Image 
              src="/photo-meta.svg" 
              alt={t('aria.photoMetadata')}
              width={280}
              height={280}
              className="w-full h-auto"
            />
          </div>
          
          <TransitionButton />
          
          <div className="max-w-full md:max-w-[280px] lg:max-w-full animate-fade-in-up">
          <p className="text-frost/40 text-sm font-medium text-justify tracking-tight leading-[1.2] pb-3">
            {t('story.paragraph1')}
          </p>
          <p className="text-frost/40 text-sm font-medium text-justify tracking-tight leading-[1.2] pb-3">
            {t('story.paragraph2')}
          </p>
          <p className="text-frost/60 text-sm font-bold text-justify tracking-tight leading-[1.2]">
            {t('story.callToAction')}
          </p>
          </div>
          
          
          {/* Social icons - visible on desktop */}
          <div className="flex w-full max-w-full md:max-w-[280px] lg:max-w-full items-center justify-between">
            <svg width="92" height="16" viewBox="0 0 92 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-[91px] h-[16px] text-frost/50">
              <g clipPath="url(#clip0_233_744)">
                <path d="M0.333374 15.741V2.76185H6.0096C6.42493 2.76185 6.81142 2.84838 7.16907 3.02144C7.53825 3.18296 7.85552 3.40216 8.12087 3.67905C8.38623 3.95594 8.59389 4.27321 8.74388 4.63085C8.89386 4.97697 8.96885 5.34038 8.96885 5.7211V9.87444C8.96885 10.2321 8.89962 10.5897 8.76118 10.9474C8.62274 11.305 8.42084 11.6281 8.15549 11.9165C7.90167 12.1934 7.59017 12.4184 7.22099 12.5914C6.86334 12.7645 6.45954 12.851 6.0096 12.851H3.2061V15.741H0.333374ZM3.2061 11.3973H6.09612V4.19822H3.2061V11.3973Z" fill="currentColor"/>
                <path d="M11.5299 12.851V2.76185H14.4027V4.18091C14.4027 4.18091 14.4892 4.10592 14.6622 3.95594C14.8468 3.80596 15.118 3.64444 15.4756 3.47138C15.8448 3.29833 16.2947 3.13681 16.8254 2.98683C17.3677 2.83685 18.0022 2.76185 18.729 2.76185V4.18091C18.083 4.18091 17.4946 4.26744 16.9639 4.44049C16.4332 4.60201 15.9775 4.78084 15.5967 4.97697C15.216 5.1731 14.9218 5.35769 14.7142 5.53074C14.5065 5.69226 14.4027 5.77302 14.4027 5.77302V12.851H11.5299Z" fill="currentColor"/>
                <path d="M22.7093 12.851H19.8366V2.76185H22.7093V12.851ZM22.7093 1.30819H19.8366V-0.128174H22.7093V1.30819Z" fill="currentColor"/>
                <path d="M31.0161 4.19822H28.1261V12.851H25.2534V2.76185H36.727C37.1192 2.76185 37.4942 2.84838 37.8518 3.02144C38.2095 3.18296 38.521 3.40216 38.7863 3.67905C39.0517 3.9444 39.2593 4.2559 39.4093 4.61355C39.5708 4.95966 39.6516 5.32308 39.6516 5.7038V12.851H36.7789V4.19822H33.8888V12.851H31.0161V4.19822Z" fill="currentColor"/>
                <path d="M45.0855 8.5246V11.3973H47.7679C47.9756 11.3973 48.1775 11.3627 48.3736 11.2935C48.5697 11.2127 48.7428 11.1089 48.8928 10.982C49.0427 10.8551 49.1639 10.7051 49.2562 10.532C49.3485 10.359 49.3946 10.1686 49.3946 9.96097H50.8137C50.8137 10.3417 50.7272 10.7051 50.5541 11.0512C50.381 11.3973 50.1503 11.7088 49.8619 11.9857C49.585 12.2511 49.2677 12.4645 48.9101 12.626C48.5524 12.776 48.189 12.851 47.8198 12.851H45.1375C44.7337 12.851 44.3529 12.7645 43.9953 12.5914C43.6492 12.4184 43.3434 12.1934 43.0781 11.9165C42.8127 11.6281 42.5993 11.305 42.4378 10.9474C42.2878 10.5897 42.2128 10.2321 42.2128 9.87444V5.7211C42.2128 5.35192 42.2878 4.9885 42.4378 4.63085C42.5993 4.27321 42.8127 3.95594 43.0781 3.67905C43.355 3.40216 43.6665 3.18296 44.0126 3.02144C44.3702 2.84838 44.7452 2.76185 45.1375 2.76185H47.8198C48.2352 2.76185 48.6274 2.84838 48.9966 3.02144C49.3658 3.18296 49.6831 3.40216 49.9484 3.67905C50.2138 3.95594 50.4214 4.27321 50.5714 4.63085C50.7329 4.9885 50.8137 5.35192 50.8137 5.7211V8.5246H45.0855ZM47.9237 7.08824V4.18091H45.0855V7.08824H47.9237Z" fill="currentColor"/>
                <path d="M53.3756 6.3268V5.32308C53.3756 4.93082 53.4506 4.57894 53.6006 4.26744C53.7621 3.9444 53.9755 3.67328 54.2409 3.45408C54.5177 3.22334 54.835 3.05028 55.1927 2.93491C55.5618 2.81954 55.9541 2.76185 56.3694 2.76185H57.5808C57.9846 2.76185 58.3654 2.84261 58.723 3.00413C59.0806 3.15411 59.3921 3.36178 59.6575 3.62713C59.9344 3.88095 60.1478 4.18091 60.2978 4.52702C60.4593 4.87313 60.5401 5.24232 60.5401 5.63458H59.121C59.121 5.19617 58.9883 4.85006 58.723 4.59624C58.4576 4.33089 58.1058 4.19822 57.6674 4.19822H56.2483V5.16733L60.5401 8.83611V9.92635C60.5401 10.3186 60.4651 10.6936 60.3151 11.0512C60.1767 11.3973 59.9748 11.7088 59.7094 11.9857C59.4556 12.2511 59.1441 12.4645 58.7749 12.626C58.4173 12.776 58.0192 12.851 57.5808 12.851H56.3694C55.9541 12.851 55.5618 12.776 55.1927 12.626C54.835 12.476 54.5177 12.2684 54.2409 12.003C53.9755 11.7377 53.7621 11.4319 53.6006 11.0858C53.4506 10.7397 53.3756 10.3648 53.3756 9.96097H54.8292C54.8292 10.3994 54.9677 10.7513 55.2446 11.0166C55.533 11.282 55.908 11.4146 56.3694 11.4146H57.6847V10.2552L53.3756 6.3268Z" fill="currentColor"/>
                <path d="M63.0849 12.851V-0.128174H65.9577V2.76185H68.7612C69.1765 2.76185 69.563 2.84261 69.9206 3.00413C70.2898 3.15411 70.6071 3.36178 70.8724 3.62713C71.1378 3.89248 71.3455 4.20398 71.4954 4.56163C71.6454 4.91928 71.7204 5.3 71.7204 5.7038V12.851H68.8477V4.18091H65.9577V12.851H63.0849Z" fill="currentColor"/>
                <path d="M77.2234 12.851C76.785 12.851 76.387 12.776 76.0294 12.626C75.6717 12.4645 75.3602 12.2511 75.0949 11.9857C74.8411 11.7204 74.6391 11.4089 74.4892 11.0512C74.3507 10.682 74.2815 10.2898 74.2815 9.87444V5.7211C74.2815 5.32885 74.3565 4.95389 74.5065 4.59624C74.6565 4.2386 74.8641 3.9271 75.1295 3.66174C75.3948 3.38485 75.7063 3.16565 76.064 3.00413C76.4216 2.84261 76.8081 2.76185 77.2234 2.76185H79.9577C80.3961 2.76185 80.7942 2.84261 81.1518 3.00413C81.521 3.16565 81.8325 3.38485 82.0863 3.66174C82.3517 3.9271 82.5536 4.2386 82.692 4.59624C82.842 4.95389 82.917 5.32885 82.917 5.7211V9.87444C82.917 10.2898 82.842 10.682 82.692 11.0512C82.5536 11.4089 82.3517 11.7204 82.0863 11.9857C81.8325 12.2511 81.521 12.4645 81.1518 12.626C80.7942 12.776 80.3961 12.851 79.9577 12.851H77.2234ZM80.0443 11.3973V4.19822H77.1542V11.3973H80.0443Z" fill="currentColor"/>
                <path d="M86.8625 -0.128174H89.7352V2.76185H91.1716V4.19822H89.7352V11.3973H91.1716V12.851H88.4546C88.247 12.851 88.0451 12.8106 87.8489 12.7299C87.6528 12.6376 87.4797 12.5164 87.3298 12.3664C87.1913 12.2165 87.0759 12.0492 86.9836 11.8646C86.9029 11.6684 86.8625 11.4665 86.8625 11.2589V4.19822H85.4781V2.76185H86.8625V-0.128174Z" fill="currentColor"/>
              </g>
              <defs>
                <clipPath id="clip0_233_744">
                  <rect width="91" height="16" fill="white" transform="translate(0.333374)"/>
                </clipPath>
              </defs>
            </svg>
            <SocialIcons />
          </div>
        </div>
      </div>
  
      </main>
    </HomePageWrapper>
  );
}