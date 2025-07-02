'use client'

import React from 'react'
import { SceneDropdown } from './SceneDropdown'
import { WardrobeDropdown } from './WardrobeDropdown'

export function OptionButtons() {
  return (
    <div className="space-y-3">
      <SceneDropdown />
      <WardrobeDropdown />
    </div>
  )
} 