'use client'

import React, { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogPortal, DialogOverlay } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/auth'
import { cn } from "@/lib/utils"

// Custom DialogContent without close button
const NoCloseDialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      data-slot="dialog-content"
      className={cn(
        "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
        className
      )}
      {...props}
    >
      {children}
      {/* No close button */}
    </DialogPrimitive.Content>
  </DialogPortal>
))
NoCloseDialogContent.displayName = "NoCloseDialogContent"

// Schema for form validation
const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'Please select an option' })
  })
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileCompletionModalProps {
  isOpen: boolean
  onComplete: () => void
  user: User | null
}

export function ProfileCompletionModal({ isOpen, onComplete, user }: ProfileCompletionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const { control, handleSubmit, setValue, formState: { errors, isValid } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: user?.full_name || '',
      gender: undefined
    }
  })

  // Update form when user data changes
  useEffect(() => {
    if (user?.full_name) {
      setValue('full_name', user.full_name)
    }
  }, [user, setValue])

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update your profile.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Update user profile in the database
      const { error } = await supabase
        .from('users')
        .update({
          full_name: data.full_name,
          gender: data.gender
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.'
      })

      // Call the onComplete callback to proceed
      onComplete()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Overlay styles - creates a backdrop that prevents clicking through
  const backdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    zIndex: 40,
    display: isOpen ? 'block' : 'none'
  } as React.CSSProperties

  return (
    <>
      {/* Backdrop div - ensures we capture all clicks even if modal is removed from DOM */}
      <div style={backdropStyle} />
      
      <Dialog open={isOpen} onOpenChange={() => {/* prevent closing */}}>
        <NoCloseDialogContent 
          className="w-full max-w-md z-50" 
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Complete Your Profile</DialogTitle>
            <DialogDescription>
              Please provide the following information to continue. This helps us generate more accurate headshots for you.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Controller
                name="full_name"
                control={control}
                render={({ field }) => (
                  <Input
                    id="full_name"
                    placeholder="Enter your full name"
                    {...field}
                  />
                )}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && (
                <p className="text-sm text-destructive mt-1">{errors.gender.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                This information helps us generate more accurate headshots for you.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
            </Button>
          </form>
        </NoCloseDialogContent>
      </Dialog>
    </>
  )
} 