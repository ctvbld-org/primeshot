'use client'

import React from 'react'
import { SceneDropdown } from './SceneDropdown'
import { WardrobeDropdown } from './WardrobeDropdown'

export function OptionButtons() {
  return (
    <div className="gap-3 flex flex-row justify-center items-center">
      <SceneDropdown />
      <WardrobeDropdown />
    </div>
  )
} 