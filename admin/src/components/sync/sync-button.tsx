'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@primeshot/common/web/ui/button'
import { SyncDialog } from './sync-dialog'

export function SyncButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div style={{ position: 'fixed', right: '1rem', bottom: '1rem', zIndex: 50 }}>
      <Button 
        variant="secondary" 
        icon={<Upload className="h-4 w-4" />}
        size="lg"
        onClick={() => setIsDialogOpen(true)}
      >
        Deploy Changes
      </Button>
      
      <SyncDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </div>
  )
} 