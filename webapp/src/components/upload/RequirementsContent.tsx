'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@primeshot/common/web/Icon'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'

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
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#202A32]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#44E3C9]/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2.5C16.5388 2.5 13.1554 3.52636 10.2775 5.44928C7.39967 7.37221 5.15665 10.1053 3.83212 13.303C2.50758 16.5007 2.16102 20.0194 2.83627 23.4141C3.51151 26.8087 5.17822 29.9269 7.62564 32.3744C10.0731 34.8218 13.1913 36.4885 16.5859 37.1637C19.9806 37.839 23.4993 37.4924 26.697 36.1679C29.8947 34.8434 32.6278 32.6003 34.5507 29.7225C36.4737 26.8446 37.5 23.4612 37.5 20C37.5 15.3587 35.6563 10.9075 32.3744 7.62563C29.0925 4.34374 24.6413 2.5 20 2.5ZM20 35C17.0333 35 14.1332 34.1203 11.6665 32.472C9.19972 30.8238 7.27713 28.4811 6.14181 25.7403C5.0065 22.9994 4.70945 19.9834 5.28823 17.0736C5.86701 14.1639 7.29562 11.4912 9.39341 9.3934C11.4912 7.29561 14.1639 5.867 17.0737 5.28822C19.9834 4.70944 22.9994 5.00649 25.7403 6.14181C28.4811 7.27712 30.8238 9.19971 32.472 11.6664C34.1203 14.1332 35 17.0333 35 20C35 23.9782 33.4197 27.7936 30.6066 30.6066C27.7936 33.4196 23.9783 35 20 35Z" fill="#44E3C9"/>
              <path d="M14.375 13.75C13.7569 13.75 13.1528 13.9333 12.6389 14.2767C12.1249 14.62 11.7244 15.1081 11.4879 15.6791C11.2514 16.2501 11.1895 16.8785 11.3101 17.4847C11.4306 18.0908 11.7283 18.6477 12.1653 19.0847C12.6023 19.5217 13.1592 19.8194 13.7654 19.94C14.3715 20.0605 14.9999 19.9986 15.5709 19.7621C16.1419 19.5256 16.63 19.1251 16.9734 18.6112C17.3167 18.0973 17.5 17.4931 17.5 16.875C17.5033 16.4637 17.4248 16.0558 17.2689 15.6752C17.113 15.2945 16.883 14.9487 16.5921 14.6579C16.3013 14.367 15.9555 14.137 15.5748 13.9811C15.1942 13.8252 14.7863 13.7467 14.375 13.75Z" fill="#44E3C9"/>
              <path d="M25.625 13.75C25.0069 13.75 24.4028 13.9333 23.8889 14.2767C23.3749 14.62 22.9744 15.1081 22.7379 15.6791C22.5014 16.2501 22.4395 16.8785 22.5601 17.4847C22.6806 18.0908 22.9783 18.6477 23.4153 19.0847C23.8523 19.5217 24.4092 19.8194 25.0154 19.94C25.6215 20.0605 26.2499 19.9986 26.8209 19.7621C27.3919 19.5256 27.88 19.1251 28.2234 18.6112C28.5667 18.0973 28.75 17.4931 28.75 16.875C28.7533 16.4637 28.6748 16.0558 28.5189 15.6752C28.363 15.2945 28.133 14.9487 27.8421 14.6579C27.5513 14.367 27.2055 14.137 26.8248 13.9811C26.4442 13.8252 26.0363 13.7467 25.625 13.75Z" fill="#44E3C9"/>
              <path d="M20 30C21.7255 29.9971 23.4208 29.5478 24.9212 28.6957C26.4216 27.8436 27.6761 26.6178 28.5625 25.1375L26.425 23.8875C25.7579 24.9953 24.8158 25.9117 23.69 26.5479C22.5642 27.1841 21.2931 27.5185 20 27.5185C18.7069 27.5185 17.4358 27.1841 16.31 26.5479C15.1842 25.9117 14.2421 24.9953 13.575 23.8875L11.4375 25.1375C12.324 26.6178 13.5784 27.8436 15.0788 28.6957C16.5792 29.5478 18.2745 29.9971 20 30Z" fill="#44E3C9"/>
            </svg>
          </div>
          <div>
            <h3 className="text-white text-lg font-medium">Create a Character</h3>
          </div>
        </div>
        <p className="text-[#C0CED8] text-sm leading-relaxed">
          Upload 12 or more high-quality selfies to train a reusable Character that captures your true likeness in every shoot.
        </p>
        <div className="flex items-center gap-2 mt-4 text-xs text-[#C0CED8]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8C14.6667 4.3181 11.6819 1.33333 8 1.33333C4.3181 1.33333 1.33333 4.3181 1.33333 8C1.33333 11.6819 4.3181 14.6667 8 14.6667Z" stroke="#44E3C9" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 8L7.33333 9.33333L10 6.66667" stroke="#44E3C9" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Uploads are private and secure.
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Upload tips */}
        <div className="p-6 border-b border-[#202A32]">
          <h4 className="text-[#C0CED8] font-medium mb-4">Upload tips</h4>
          <div className="space-y-4">
            {requirements.map((requirement, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon variant={requirement.icon as any} size={20} className="text-[#44E3C9]" />
                </div>
                <span className="text-sm text-[#C0CED8] leading-relaxed">
                  {t(`requirements.tips.${requirement.text}`, { minImages: UPLOAD_CONSTANTS.MIN_IMAGES, maxImages: UPLOAD_CONSTANTS.MAX_IMAGES })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Do's and don'ts */}
        <div className="p-6">
          <h4 className="text-[#C0CED8] font-medium mb-4">Do's and don'ts</h4>
          <div className="space-y-6">
            {dodonts.map((dodont, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border border-[#C0CED8]/30 flex items-center justify-center text-xs text-[#C0CED8]/70">
                    {index + 1}
                  </div>
                  <span className="text-sm text-[#C0CED8]/80 font-medium">
                    {t(`requirements.dodonts.${dodont.text}`)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <img 
                      src={dodont.doImgURL} 
                      alt="Do" 
                      className="w-full h-24 object-cover rounded"
                    />
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#44E3C9]/20 backdrop-blur rounded-full flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="#44E3C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <img 
                      src={dodont.dontImgURL} 
                      alt="Don't" 
                      className="w-full h-24 object-cover rounded"
                    />
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-red-500/20 backdrop-blur rounded-full flex items-center justify-center">
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
    </div>
  )
}