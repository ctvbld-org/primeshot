'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@primeshot/common/web/Icon'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import styles from './RequirementsContent.module.css'

// Requirements data
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

export function RequirementsContent() {
  const { t } = useTranslation('upload')

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerRow}>
           <svg width="30" height="39" viewBox="0 0 30 39" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.54688 19.9688C5.54688 21.6629 5.87996 23.341 6.52832 24.9062C7.17662 26.4712 8.12738 27.893 9.3252 29.0908C10.5232 30.2887 11.9455 31.2394 13.5107 31.8877C15.076 32.536 16.754 32.8701 18.4482 32.8701V38.416C16.0257 38.416 13.6268 37.9387 11.3887 37.0117C9.15044 36.0847 7.11639 34.7257 5.40332 33.0127C3.69035 31.2997 2.33137 29.2664 1.4043 27.0283C0.477192 24.7902 0 22.3913 0 19.9688H5.54688ZM29.4775 17.7812C29.4775 22.0021 26.0549 25.4238 21.834 25.4238H18.4697V22.6133H23.9736V7.03906H29.4775V17.7812ZM14.9297 0C16.8728 5.52435e-05 18.4482 1.57548 18.4482 3.51855C18.4481 5.46152 16.8728 7.03705 14.9297 7.03711C12.9866 7.03711 11.4113 5.46156 11.4111 3.51855C11.4111 1.57544 12.9865 8.49359e-08 14.9297 0Z" fill="#2ADED8"/>
          </svg>
          <div>
            <h3 className={styles.headerTitle}>Create a Character</h3>
          </div>
        </div>
        <p className={styles.headerDesc}>
          Upload {UPLOAD_CONSTANTS.MIN_IMAGES} high-quality photos of yourself to train a reusable Character that captures your true likeness in every shoot.
        </p>
        <small className={styles.secureNote}>
          <Icon variant="secure" size={16} />
          Uploads are private and secure.
        </small>
      </div>

        <div className={`${styles.section} ${styles.sectionBorder}`}>
          <h4 className={styles.sectionTitle}>Upload tips</h4>
          <div className={styles.tipsList}>
            {requirements.map((requirement, index) => (
              <div key={index} className={styles.requirementRow}>
                <div className={styles.requirementIconWrap}>
                  <Icon variant={requirement.icon as any} size={20} className={styles.requirementIcon} />
                </div>
                <span className={styles.requirementText}>
                  {t(`requirements.tips.${requirement.text}`, { minImages: UPLOAD_CONSTANTS.MIN_IMAGES, maxImages: UPLOAD_CONSTANTS.MAX_IMAGES })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Do's and don'ts */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Do's and don'ts</h4>
          <div className={styles.dodontsList}>
            {dodonts.map((dodont, index) => (
              <div key={index} className={styles.dodontItem}>
                <div className={styles.ddHeader}>
                  <span className={styles.ddLabel}>
                    {t(`requirements.dodonts.${dodont.text}`)}
                  </span>
                </div>
                <div className={styles.ddImages}>
                  <div className={styles.ddImageWrap}>
                    <img 
                      src={dodont.doImgURL} 
                      alt="Do" 
                      className={styles.ddImage}
                    />
                    <div className={`${styles.ddBadge} ${styles.ddBadgeOk}`}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="#44E3C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <div className={styles.ddImageWrap}>
                    <img 
                      src={dodont.dontImgURL} 
                      alt="Don't" 
                      className={styles.ddImage}
                    />
                    <div className={`${styles.ddBadge} ${styles.ddBadgeNo}`}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 3L3 9M3 3L9 9" stroke="#FF4242" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  )
}