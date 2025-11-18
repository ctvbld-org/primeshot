// common/fonts.ts
import localFont from 'next/font/local'

export const carb = localFont({
  variable: '--font-carb',
  display: 'swap',
  src: [
    // 700 (bold)
    {
      path: './assets/font/carb-bold-webfont.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './assets/font/carb-bold-webfont.woff',
      weight: '700',
      style: 'normal',
    },
    // 600 (semibold)
    {
      path: './assets/font/carb-semibold-webfont.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './assets/font/carb-semibold-webfont.woff',
      weight: '600',
      style: 'normal',
    },
    
    // 500 (medium)
    {
      path: './assets/font/carb-medium-webfont.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './assets/font/carb-medium-webfont.woff',
      weight: '500',
      style: 'normal',
    },
    
    // 400 (light)
    {
      path: './assets/font/carb-light-webfont.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './assets/font/carb-light-webfont.woff',
      weight: '400',
      style: 'normal',
    },

    // 200 (extra-light)
    {
      path: './assets/font/carb-extralight-webfont.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: './assets/font/carb-extralight-webfont.woff',
      weight: '200',
      style: 'normal',
    },
  ],
})

