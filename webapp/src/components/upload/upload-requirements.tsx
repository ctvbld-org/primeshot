'use client'

import { memo, useRef, useState, useEffect } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from '@primeshot/common/web/ui/dialog'
import { Icon } from '@/components/icons/icon'
import { usePhotoRequirements } from '@/hooks/use-photo-requirements'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { UploadRequirementsSkeleton } from '@/components/skeleton/upload/requirements'
import styles from './upload-requirements.module.css'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'

const requirements = [
  {
    text: "naturalLight",
    icon: "sun"
  },
  {
    text: "photos", 
    icon: "crop"
  },
  {
    text: "expression",
    icon: "smilyFace"
  },
  {
    text: "avoid",
    icon: "insights"
  },
  {
    text: "clothing",
    icon: "tshirt"
  },
  {
    text: "quantity",
    icon: "multitask"
  }
] as const;

const dodonts = [
  {
    text: "eyes",
    doImgURL: `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/requirements/do_1.webp`,
    dontImgURL: `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/requirements/dont_1.webp`
  },
  {
    text: "lighting", 
    doImgURL: `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/requirements/do_2.webp`,
    dontImgURL: `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/requirements/dont_2.webp`
  },
  {
    text: "frame",
    doImgURL: `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/requirements/do_3.webp`,
    dontImgURL: `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/requirements/dont_3.webp`
  },
  {
    text: "face",
    doImgURL: `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/requirements/do_4.webp`,
    dontImgURL: `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/requirements/dont_4.webp`
  }
] as const;

function UploadRequirementsComponent() {
  const { t } = useTranslation('upload');
  const { isOpen, onOpenChange, hasSeenRequirements } = usePhotoRequirements();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);
  const [totalImages, setTotalImages] = useState(0);
  const [, setLoadedImages] = useState(0);
  const dialogBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset loading state when dialog opens
      setAllImagesLoaded(false);
      setLoadedImages(0);
      // Count total images (editorial + do/don't images)
      const total = 1 + (dodonts.length * 2); // 1 editorial + 2 images per dodont
      setTotalImages(total);
    }
  }, [isOpen]);

  const handleImageLoad = () => {
    setLoadedImages(prev => {
      const newCount = prev + 1;
      if (newCount === totalImages) {
        setAllImagesLoaded(true);
      }
      return newCount;
    });
  };

  // Track scroll position
  const handleScroll = () => {
    if (dialogBodyRef.current && !hasScrolledToBottom) {
      const { scrollTop, scrollHeight, clientHeight } = dialogBodyRef.current;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
      if (isAtBottom) {
        setHasScrolledToBottom(true);
      }
    }
  };

  return (
    <>
      <Button
        className={styles.openButton}
        variant="outline"
        onClick={() => onOpenChange(true)}
        type="button"
        aria-label={t('requirements.buttons.open')}
      >
        <Icon variant="check" size={22} />
        {t('requirements.buttons.open')}
        <Icon variant="chevronRight" size={16} />
      </Button>

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className={styles.dialog}>
          <DialogHeader>
            <DialogTitle style={{position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0}}>
              {t('requirements.title', 'Photo Upload Requirements')}
            </DialogTitle>
          </DialogHeader>

          <DialogBody 
            ref={dialogBodyRef} 
            onScroll={handleScroll}
          >
            {!allImagesLoaded && <UploadRequirementsSkeleton />}
            <div className={cn(styles.container, allImagesLoaded && styles.visible)}>
              <div className={styles.header + " " + styles.section}>
                <div className={styles.leftSide}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 2.5C16.5388 2.5 13.1554 3.52636 10.2775 5.44928C7.39967 7.37221 5.15665 10.1053 3.83212 13.303C2.50758 16.5007 2.16102 20.0194 2.83627 23.4141C3.51151 26.8087 5.17822 29.9269 7.62564 32.3744C10.0731 34.8218 13.1913 36.4885 16.5859 37.1637C19.9806 37.839 23.4993 37.4924 26.697 36.1679C29.8947 34.8434 32.6278 32.6003 34.5507 29.7225C36.4737 26.8446 37.5 23.4612 37.5 20C37.5 15.3587 35.6563 10.9075 32.3744 7.62563C29.0925 4.34374 24.6413 2.5 20 2.5ZM20 35C17.0333 35 14.1332 34.1203 11.6665 32.472C9.19972 30.8238 7.27713 28.4811 6.14181 25.7403C5.0065 22.9994 4.70945 19.9834 5.28823 17.0736C5.86701 14.1639 7.29562 11.4912 9.39341 9.3934C11.4912 7.29561 14.1639 5.867 17.0737 5.28822C19.9834 4.70944 22.9994 5.00649 25.7403 6.14181C28.4811 7.27712 30.8238 9.19971 32.472 11.6664C34.1203 14.1332 35 17.0333 35 20C35 23.9782 33.4197 27.7936 30.6066 30.6066C27.7936 33.4196 23.9783 35 20 35Z" fill="#44E3C9"/>
                    <path d="M14.375 13.75C13.7569 13.75 13.1528 13.9333 12.6389 14.2767C12.1249 14.62 11.7244 15.1081 11.4879 15.6791C11.2514 16.2501 11.1895 16.8785 11.3101 17.4847C11.4306 18.0908 11.7283 18.6477 12.1653 19.0847C12.6023 19.5217 13.1592 19.8194 13.7654 19.94C14.3715 20.0605 14.9999 19.9986 15.5709 19.7621C16.1419 19.5256 16.63 19.1251 16.9734 18.6112C17.3167 18.0973 17.5 17.4931 17.5 16.875C17.5033 16.4637 17.4248 16.0558 17.2689 15.6752C17.113 15.2945 16.883 14.9487 16.5921 14.6579C16.3013 14.367 15.9555 14.137 15.5748 13.9811C15.1942 13.8252 14.7863 13.7467 14.375 13.75Z" fill="#44E3C9"/>
                    <path d="M25.625 13.75C25.0069 13.75 24.4028 13.9333 23.8889 14.2767C23.3749 14.62 22.9744 15.1081 22.7379 15.6791C22.5014 16.2501 22.4395 16.8785 22.5601 17.4847C22.6806 18.0908 22.9783 18.6477 23.4153 19.0847C23.8523 19.5217 24.4092 19.8194 25.0154 19.94C25.6215 20.0605 26.2499 19.9986 26.8209 19.7621C27.3919 19.5256 27.88 19.1251 28.2234 18.6112C28.5667 18.0973 28.75 17.4931 28.75 16.875C28.7533 16.4637 28.6748 16.0558 28.5189 15.6752C28.363 15.2945 28.133 14.9487 27.8421 14.6579C27.5513 14.367 27.2055 14.137 26.8248 13.9811C26.4442 13.8252 26.0363 13.7467 25.625 13.75Z" fill="#44E3C9"/>
                    <path d="M20 30C21.7255 29.9971 23.4208 29.5478 24.9212 28.6957C26.4216 27.8436 27.6761 26.6178 28.5625 25.1375L26.425 23.8875C25.7579 24.9953 24.8158 25.9117 23.69 26.5479C22.5642 27.1841 21.2931 27.5185 20 27.5185C18.7069 27.5185 17.4358 27.1841 16.31 26.5479C15.1842 25.9117 14.2421 24.9953 13.575 23.8875L11.4375 25.1375C12.324 26.6178 13.5784 27.8436 15.0788 28.6957C16.5792 29.5478 18.2745 29.9971 20 30Z" fill="#44E3C9"/>
                  </svg>
                  <h2 className={styles.headerTitle}>{t('requirements.title')}</h2>
                </div>
                <div className={styles.rightSide}>
                  <h2 className={styles.headerHeading}>
                    {t('requirements.heading')} <br /><span className={styles.headerHeadingHighlight}>{t('requirements.headingHighlight')}</span>
                  </h2>
                  <p className={styles.headerDescription}>{t('requirements.description')}</p>
                </div>
              </div>

              <div className={styles.editorialImage}>
                <img 
                  src={`${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/requirements/editorial_example.webp`} 
                  alt="Editorial Headshot" 
                  onLoad={handleImageLoad}
                />
              </div>

              <div className={styles.section}>
                <div className={styles.sticky + " " + styles.leftSide}>
                  <h2 className={styles.requirementsSideHeading}>{t('requirements.sideHeading.tips')}</h2>
                </div>
                <div className={styles.requirementsList + " " + styles.rightSide}>
                  {requirements.map((requirement, index) => (
                    <div key={index} className={styles.requirementItem}>
                      <Icon variant={`${requirement.icon}` as any} size={32} className={cn("text-accent", styles.requirementIcon)} />
                      <span className={styles.requirementText}>{t(`requirements.tips.${requirement.text}`, { minImages: UPLOAD_CONSTANTS.MIN_IMAGES, maxImages: UPLOAD_CONSTANTS.MAX_IMAGES })}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.tipBox}>
                <Icon variant="idea" size={48} className={styles.tipIcon} />
                <p className={styles.tipText}>{t('requirements.tipBox')}</p>
              </div>

              <div className={styles.section}>
                <div className={styles.sticky + " " + styles.leftSide}>
                  <h2 className={styles.requirementsSideHeading}>{t('requirements.sideHeading.dodonts')}</h2>
                </div>
                <div className={styles.dodontList + " " + styles.rightSide}>
                  {dodonts.map((dodont, index) => (
                    <div key={index} className={styles.dodontItem}>
                      <div className={styles.dodontHeader}>
                        <span className={styles.dodontNumber}>{index + 1}</span>
                        <span className={styles.dodontText}>{t(`requirements.dodonts.${dodont.text}`)}</span>
                      </div>
                      <div className={styles.dodontImages}>
                        <div className={styles.doImage}>
                          <img 
                            src={dodont.doImgURL} 
                            alt="Do" 
                            onLoad={handleImageLoad}
                          />
                          <svg className={styles.doIcon} width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="32" height="32" rx="16" fill="#09090B" fillOpacity="0.6"/>
                            <rect x="1.5" y="1.5" width="35" height="35" rx="17.5" stroke="#44E3C9" strokeOpacity="0.2" strokeWidth="3"/>
                            <path d="M25.0645 13.9463C25.4081 13.6662 25.9151 13.6856 26.2354 14.0059L26.2949 14.0723C26.5567 14.3929 26.5564 14.8559 26.2949 15.1768L26.2354 15.2432L18.0088 23.4697C17.5512 23.9273 16.8269 23.956 16.3359 23.5557L16.2412 23.4697L11.7646 18.9932C11.4234 18.6515 11.4231 18.0974 11.7646 17.7559L11.832 17.6963C12.1755 17.4164 12.6817 17.4361 13.002 17.7559L16.5947 21.3477L16.6514 21.3994C16.9459 21.6398 17.3806 21.6223 17.6553 21.3477L24.998 14.0059L25.0645 13.9463Z" fill="#44E3C9" stroke="#44E3C9" strokeWidth="0.5"/>
                          </svg>
                        </div>
                        <div className={styles.dontImage}>
                          <img 
                            src={dodont.dontImgURL} 
                            alt="Don't" 
                            onLoad={handleImageLoad}
                          />
                          <svg className={styles.dontIcon} width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="32" height="32" rx="16" fill="#09090B" fillOpacity="0.6"/>
                            <rect x="1.5" y="1.5" width="35" height="35" rx="17.5" stroke="#FF4242" strokeOpacity="0.3" strokeWidth="3"/>
                            <path d="M23.3232 13.2803C23.7131 12.9621 24.2879 12.9852 24.6514 13.3486C25.0148 13.7121 25.0379 14.2869 24.7197 14.6768L24.6514 14.752L20.9336 18.4697C20.6409 18.7626 20.6409 19.2374 20.9336 19.5303L24.6514 23.248C25.0389 23.6356 25.0389 24.2638 24.6514 24.6514C24.2638 25.0389 23.6356 25.0389 23.248 24.6514L19.5303 20.9336C19.2374 20.6409 18.7626 20.6409 18.4697 20.9336L14.752 24.6514C14.3644 25.0389 13.7362 25.0389 13.3486 24.6514C12.9611 24.2638 12.9611 23.6356 13.3486 23.248L17.0664 19.5303C17.3591 19.2374 17.3591 18.7626 17.0664 18.4697L13.3486 14.752C12.9611 14.3644 12.9611 13.7362 13.3486 13.3486C13.7362 12.9611 14.3644 12.9611 14.752 13.3486L18.4697 17.0664C18.7626 17.3591 19.2374 17.3591 19.5303 17.0664L23.248 13.3486L23.3232 13.2803Z" fill="#FF4242" stroke="#FF4242" strokeWidth="0.5"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button 
              onClick={() => onOpenChange(false)}
              type="button"
              disabled={!hasSeenRequirements && !hasScrolledToBottom}
            >
              {t('requirements.buttons.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const UploadRequirements = memo(UploadRequirementsComponent); 