'use client'

import * as React from "react"
import { TopBanner } from "./top-banner"
import { useBanner } from "./use-banner"

export function Banner() {
  const { banner, hideBanner } = useBanner()

  if (!banner?.isVisible) {
    return null
  }

  return (
    <TopBanner
      title={banner.title}
      description={banner.description}
      variant={banner.variant}
      onClose={hideBanner}
      className={banner.className}
    />
  )
} 