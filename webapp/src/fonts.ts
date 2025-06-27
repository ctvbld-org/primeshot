// website/src/fonts.ts
import localFont from 'next/font/local'

export const carb = localFont({
  variable: '--font-carb',          // CSS var you’ll reference
  display: 'swap',
  src: [
    // 400 (light)
    {
      path: '../../common/assets/font/carb-light-webfont.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../common/assets/font/carb-light-webfont.woff',
      weight: '400',
      style: 'normal',
    },

    // 200 (extra-light)
    {
      path: '../../common/assets/font/carb-extralight-webfont.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../../common/assets/font/carb-extralight-webfont.woff',
      weight: '200',
      style: 'normal',
    },
  ],
})