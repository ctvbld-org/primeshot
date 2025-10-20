'use client'

import React, { useCallback, useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@primeshot/common/web/ui/card'
import styles from './FileUploader.module.css'
import clsx from 'clsx'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import { Loader } from '@primeshot/common/web/ui/loader'
import { toast } from '@primeshot/common/web/ui/use-toast'
import type { FileWithScore } from '@/lib/types'
import { Icon } from '@primeshot/common/web/Icon'

export interface FileUploaderProps {
  handleNewFiles: (files: File[]) => File[]
  addFiles: (files: File[]) => Promise<FileState[]>
  acceptedFiles?: FileWithScore[]
  isReady: boolean  
  isAnalyzing: boolean
  isUploading: boolean
  analyzingCount: number
  uploadedCount: number
  disabled?: boolean
  minImages?: number
  maxImages?: number
  onCreateObjectURL?: (file: File) => string
  onRevokeObjectURL?: (url: string) => void
  currentUploadingIndex?: number | null
  uploadedFiles?: string[]
  isTransitioningToReview?: boolean
  bodyShotValidation?: { isValid: boolean; errors: string[]; i18nErrors?: { key: string; params?: Record<string, any> }[] }
}

interface FileState {
  file: File
  previewUrl?: string
  qualityResult?: any // Replace with proper type
  uploadProgress: { progress: number; isUploading: boolean }
}

export type FileUploaderHandle = {
  openFileDialog: () => void
}

export const FileUploader = React.forwardRef<FileUploaderHandle, FileUploaderProps>(function FileUploader({ 
  handleNewFiles,
  addFiles,
  acceptedFiles,
  isReady,
  isAnalyzing,
  analyzingCount,
  isUploading,
  uploadedCount,
  disabled = false,
  minImages = UPLOAD_CONSTANTS.MIN_IMAGES,
  maxImages = UPLOAD_CONSTANTS.MAX_IMAGES,
  onCreateObjectURL,
  onRevokeObjectURL,
  currentUploadingIndex = null,
  uploadedFiles = [],
  isTransitioningToReview = false,
  bodyShotValidation
}: FileUploaderProps, ref) {
  const { t } = useTranslation('character')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const objectUrlsRef = useRef<string[]>([])

  // Cleanup effect for object URLs
  useEffect(() => {
    return () => {
      // Revoke all created object URLs when component unmounts
      objectUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url)
        } catch (err) {
          console.warn('Failed to revoke object URL:', err)
        }
      })
      objectUrlsRef.current = []
    }
  }, [])

  // Helper function to create and track object URLs
  const createAndTrackObjectURL = useCallback((file: File): string => {
    const url = URL.createObjectURL(file)
    objectUrlsRef.current.push(url)
    return url
  }, [])

  // Helper function to safely revoke a specific URL
  const revokeObjectURL = useCallback((url: string) => {
    try {
      URL.revokeObjectURL(url)
      objectUrlsRef.current = objectUrlsRef.current.filter(u => u !== url)
    } catch (err) {
      console.warn('Failed to revoke object URL:', err)
    }
  }, [])

  // Use provided URL management functions if available, otherwise use local ones
  const createObjectURL = useCallback((file: File): string => {
    if (onCreateObjectURL) {
      return onCreateObjectURL(file)
    }
    return createAndTrackObjectURL(file)
  }, [onCreateObjectURL, createAndTrackObjectURL])

  const removeObjectURL = useCallback((url: string) => {
    if (onRevokeObjectURL) {
      onRevokeObjectURL(url)
    } else {
      revokeObjectURL(url)
    }
  }, [onRevokeObjectURL, revokeObjectURL])

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const acceptedCount = acceptedFiles?.length ?? 0
    const isMaxReached = acceptedCount >= maxImages
    const shouldBlock = disabled || isMaxReached || isAnalyzing
    
    if (shouldBlock) return
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const filesToAdd = handleNewFiles(droppedFiles)
    if (filesToAdd.length > 0) {
      try {
        await addFiles(filesToAdd)
      } catch (err) {
        console.error('File upload failed:', err)
        toast({
          title: 'Upload Failed',
          description: err instanceof Error ? err.message : 'Failed to upload files. Please try again.',
          variant: 'destructive',
          duration: 5000,
        })
      }
    }
  }, [handleNewFiles, addFiles, disabled, acceptedFiles, maxImages, isAnalyzing])

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const acceptedCount = acceptedFiles?.length ?? 0
    const isMaxReached = acceptedCount >= maxImages
    const shouldBlock = disabled || isMaxReached || isAnalyzing
    
    if (shouldBlock) return
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const filesToAdd = handleNewFiles(selectedFiles)
      if (filesToAdd.length > 0) {
        try {
          await addFiles(filesToAdd)
        } catch (err) {
          console.error('File upload failed:', err)
          toast({
            title: 'Upload Failed',
            description: err instanceof Error ? err.message : 'Failed to upload files. Please try again.',
            variant: 'destructive',
            duration: 5000,
          })
        }
      }
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }, [handleNewFiles, addFiles, disabled, acceptedFiles, maxImages, isAnalyzing])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const acceptedCount = acceptedFiles?.length ?? 0
    const isMaxReached = acceptedCount >= maxImages
    const shouldBlock = disabled || isMaxReached || isAnalyzing
    
    if (!shouldBlock) {
      setIsDragging(true)
    }
  }, [disabled, acceptedFiles, maxImages, isAnalyzing])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleBrowseClick = useCallback(() => {
    const acceptedCount = acceptedFiles?.length ?? 0
    const isMaxReached = acceptedCount >= maxImages
    const shouldBlock = disabled || isMaxReached || isAnalyzing
    
    if (!shouldBlock) {
      fileInputRef.current?.click()
    }
  }, [disabled, acceptedFiles, maxImages, isAnalyzing])

  // Expose imperative API to open file picker from parent components
  React.useImperativeHandle(ref, () => ({
    openFileDialog: () => {
      const acceptedCount = acceptedFiles?.length ?? 0
      const isMaxReached = acceptedCount >= maxImages
      const shouldBlock = disabled || isMaxReached || isAnalyzing
      
      if (!shouldBlock) {
        fileInputRef.current?.click()
      }
    }
  }), [disabled, acceptedFiles, maxImages, isAnalyzing])

  // Derived state for center overlay messages
  const acceptedCount = acceptedFiles?.length ?? 0
  const isMaxImagesReached = acceptedCount >= maxImages
  const hasMinImages = acceptedCount >= minImages
  const isFullyDisabled = disabled || isMaxImagesReached || hasMinImages || isAnalyzing
  
  const showBodyShotError = !isAnalyzing && acceptedCount >= minImages && !!bodyShotValidation && !bodyShotValidation.isValid
  const bodyErrorMessage = showBodyShotError
    ? (bodyShotValidation!.i18nErrors && bodyShotValidation!.i18nErrors[0]
        ? t(bodyShotValidation!.i18nErrors[0].key as any, bodyShotValidation!.i18nErrors[0].params)
        : bodyShotValidation!.errors?.[0])
    : undefined

  return (
    <div className={styles.fileUploaderContainer}>
      {isUploading && (
        <div className={styles.uploadingOverlay}>
          <Loader className={styles.uploadingLoader} />
          <p className={styles.uploadingText}>
            {isTransitioningToReview
              ? 'Setting up the review page for you...'
              : t('status.uploadingProgress', {
              current: currentUploadingIndex ? currentUploadingIndex + 1 : 1,
              total: acceptedFiles?.length
            })}
          </p>
        </div>
      )}
      <div className={clsx(
        styles.card,
        isFullyDisabled && styles.cardDisabled,
        isAnalyzing && styles.cardAnalyzing,
        isDragging || isAnalyzing ? styles.cardDragging : isReady ? styles.cardReady : undefined
      )}>
        <div
          className={clsx(
            styles.dropArea,
            isFullyDisabled && styles.dropAreaDisabled
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={isFullyDisabled ? undefined : handleBrowseClick}
          style={{ cursor: isFullyDisabled ? 'default' : 'pointer' }}
        >
          <div className={styles.iconContainer}>
            {isDragging ? (
              <svg width="80" height="80" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.uploadIcon}>
                <path className={styles.cloudPath} d="M42.2968 35.9474C47.3168 35.9474 51.4001 31.8691 51.4001 26.8524C51.4001 22.0808 47.6784 18.0874 42.9268 17.7624C42.6234 17.7408 42.3851 17.4974 42.3684 17.1941C42.0401 10.8774 36.8318 5.93075 30.5134 5.93075C25.9268 5.93075 21.7034 8.62409 19.7518 12.7924C19.6151 13.0841 19.2718 13.2158 18.9801 13.0941C17.5401 12.5024 16.0218 12.2024 14.4684 12.2024C7.92344 12.2024 2.59844 17.5358 2.59844 24.0908C2.59844 30.0508 7.0051 35.1441 12.8468 35.9408C13.1751 35.9841 13.4051 36.2874 13.3601 36.6158C13.3151 36.9441 13.0184 37.1891 12.6834 37.1291C6.2501 36.2541 1.39844 30.6474 1.39844 24.0908C1.39844 16.8741 7.26177 11.0024 14.4668 11.0024C15.9901 11.0024 17.4818 11.2641 18.9118 11.7824C21.1551 7.48075 25.6484 4.73242 30.5101 4.73242C37.2934 4.73242 42.9134 9.91076 43.5268 16.6158C48.6551 17.2291 52.5984 21.6291 52.5984 26.8541C52.6001 32.5291 47.9784 37.1491 42.2968 37.1491C42.2818 37.1491 42.1501 37.1424 42.1351 37.1408C41.8101 37.1158 41.5151 36.8358 41.5318 36.5108C41.5468 36.1908 41.7651 35.9358 42.0818 35.9358C42.0868 35.9358 42.0918 35.9358 42.0951 35.9358L42.2968 35.9474Z" fill="#FF973C"/>
                <path className={styles.arrowPath} d="M27.6001 48.6657H26.4001V21.7808L17.4234 30.7574L16.5768 29.9074L27.0001 19.4841L37.4251 29.9074L36.5751 30.7574L27.6001 21.7808V48.6657Z" fill="#FF973C"/>
              </svg>
            ) : isAnalyzing ? (
              <svg width="80" height="80" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path className={styles.cog} d="M27.0023 52.5994C19.454 52.5994 12.4757 49.3777 7.60234 43.7027V50.3327H6.40234V41.3994H15.3357V42.6011H8.24068C12.8957 48.2077 19.6657 51.3994 27.0023 51.3994C40.4557 51.3994 51.4023 40.4544 51.4023 26.9994H52.604C52.6023 41.1161 41.119 52.5994 27.0023 52.5994ZM2.60234 26.9994H1.40234C1.40234 12.8827 12.8857 1.39941 27.0023 1.39941C34.5507 1.39941 41.529 4.62108 46.4023 10.2944V3.66608H47.604V12.5994H38.669V11.3994H45.764C41.109 5.79108 34.3373 2.59941 27.0023 2.59941C13.5473 2.59941 2.60234 13.5444 2.60234 26.9994Z" fill="#C0CED8"/>
                <path className={styles.arrow} d="M29.5667 39.5333H24.9667C24.635 39.5333 24.3667 39.265 24.3667 38.9333V36.3217L22.9183 35.7167L21.0667 37.5683C20.955 37.68 20.8017 37.7433 20.6433 37.7433C20.4833 37.7433 20.3317 37.68 20.22 37.5683L16.9667 34.315C16.7317 34.08 16.7317 33.7 16.9667 33.465L18.8133 31.62L18.2183 30.1683H15.6C15.2683 30.1683 15 29.9 15 29.5683V24.9683C15 24.6367 15.2683 24.3683 15.6 24.3683H18.2117L18.8167 22.92L16.9667 21.0667C16.7333 20.8317 16.7333 20.4533 16.9667 20.2183L20.2183 16.965C20.4433 16.7383 20.8417 16.7383 21.0667 16.965L22.9133 18.8133L24.3667 18.2183V15.6C24.3667 15.2683 24.635 15 24.9667 15H29.5667C29.8983 15 30.1667 15.2683 30.1667 15.6V18.2117L31.6133 18.8167L33.4633 16.965C33.6883 16.74 34.0883 16.7383 34.3133 16.965L37.5667 20.2183C37.6783 20.33 37.7417 20.4833 37.7417 20.6417C37.7417 20.8017 37.6783 20.9533 37.5667 21.065L35.7183 22.9117L36.3133 24.365H38.9333C39.265 24.365 39.5333 24.6333 39.5333 24.965V29.565C39.5333 29.8967 39.265 30.165 38.9333 30.165H36.3217L35.7167 31.6117L37.5683 33.4617C37.68 33.5733 37.7433 33.7267 37.7433 33.8867C37.7433 34.0467 37.68 34.2 37.5683 34.3117L34.315 37.565C34.2033 37.6767 34.05 37.74 33.89 37.74C33.73 37.74 33.5767 37.6767 33.465 37.565L31.62 35.7167L30.1683 36.3117V38.9333C30.1667 39.265 29.8983 39.5333 29.5667 39.5333ZM25.5667 38.3333H28.9667V35.9133C28.9667 35.67 29.115 35.4517 29.34 35.3583L31.5333 34.4583C31.7567 34.3633 32.0133 34.4183 32.1867 34.5883L33.89 36.295L36.295 33.89L34.5817 32.18C34.41 32.0067 34.3583 31.7483 34.4533 31.5233L35.37 29.3367C35.4633 29.1133 35.6817 28.9667 35.9233 28.9667H38.3333V25.5667H35.9133C35.67 25.5667 35.4517 25.42 35.3583 25.195L34.4583 23.0017C34.3667 22.7783 34.4183 22.52 34.5883 22.35L36.295 20.645L33.89 18.24L32.18 19.9517C32.0067 20.1233 31.7483 20.1767 31.5233 20.0817L29.3367 19.1667C29.1133 19.0733 28.9667 18.855 28.9667 18.6133V16.2H25.5667V18.62C25.5667 18.8633 25.42 19.0833 25.195 19.175L23.0017 20.075C22.7767 20.165 22.5217 20.115 22.35 19.9433L20.645 18.2383L18.2417 20.6433L19.9533 22.3567C20.125 22.5283 20.1767 22.7883 20.0817 23.0133L19.1667 25.2C19.0733 25.4233 18.855 25.5683 18.6133 25.5683H16.2V28.9683H18.62C18.8633 28.9683 19.0833 29.1167 19.175 29.3417L20.075 31.535C20.1667 31.76 20.115 32.0167 19.9433 32.1883L18.24 33.8917L20.6433 36.2967L22.3567 34.5833C22.53 34.41 22.7883 34.3617 23.0133 34.455L25.2 35.3717C25.4233 35.465 25.5683 35.6833 25.5683 35.925L25.5667 38.3333ZM27.2667 32.8667C24.1783 32.8667 21.6667 30.3533 21.6667 27.2667C21.6667 24.18 24.1783 21.6667 27.2667 21.6667C30.355 21.6667 32.8667 24.1783 32.8667 27.2667C32.8667 30.355 30.355 32.8667 27.2667 32.8667ZM27.2667 22.8667C24.84 22.8667 22.8667 24.8417 22.8667 27.2667C22.8667 29.6933 24.8417 31.6667 27.2667 31.6667C29.6933 31.6667 31.6667 29.6933 31.6667 27.2667C31.6667 24.84 29.6933 22.8667 27.2667 22.8667Z" fill="#C0CED8"/>
              </svg>
            ) : showBodyShotError ? (
              <svg width="80" height="80" viewBox="0 0 40 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 3C16.5388 3 13.1554 4.02636 10.2775 5.94928C7.39967 7.87221 5.15665 10.6053 3.83212 13.803C2.50758 17.0007 2.16102 20.5194 2.83627 23.9141C3.51151 27.3087 5.17822 30.4269 7.62564 32.8744C10.0731 35.3218 13.1913 36.9885 16.5859 37.6637C19.9806 38.339 23.4993 37.9924 26.697 36.6679C29.8947 35.3434 32.6278 33.1003 34.5507 30.2225C36.4737 27.3446 37.5 23.9612 37.5 20.5C37.5 15.8587 35.6563 11.4075 32.3744 8.12563C29.0925 4.84374 24.6413 3 20 3ZM20 35.5C17.0333 35.5 14.1332 34.6203 11.6665 32.972C9.19972 31.3238 7.27713 28.9811 6.14181 26.2403C5.0065 23.4994 4.70945 20.4834 5.28823 17.5736C5.86701 14.6639 7.29562 11.9912 9.39341 9.8934C11.4912 7.79561 14.1639 6.367 17.0737 5.78822C19.9834 5.20944 22.9994 5.50649 25.7403 6.64181C28.4811 7.77712 30.8238 9.69971 32.472 12.1664C34.1203 14.6332 35 17.5333 35 20.5C35 24.4782 33.4197 28.2936 30.6066 31.1066C27.7936 33.9196 23.9783 35.5 20 35.5Z" fill="#FF4242"/>
                <path d="M14.375 14.25C13.7569 14.25 13.1528 14.4333 12.6389 14.7767C12.1249 15.12 11.7244 15.6081 11.4879 16.1791C11.2514 16.7501 11.1895 17.3785 11.3101 17.9847C11.4306 18.5908 11.7283 19.1477 12.1653 19.5847C12.6023 20.0217 13.1592 20.3194 13.7654 20.44C14.3715 20.5605 14.9999 20.4986 15.5709 20.2621C16.1419 20.0256 16.63 19.6251 16.9734 19.1112C17.3167 18.5973 17.5 17.9931 17.5 17.375C17.5 16.5462 17.1708 15.7513 16.5847 15.1653C15.9987 14.5792 15.2038 14.25 14.375 14.25Z" fill="#FF4242"/>
                <path d="M25.625 14.25C25.0069 14.25 24.4028 14.4333 23.8889 14.7767C23.3749 15.12 22.9744 15.6081 22.7379 16.1791C22.5014 16.7501 22.4395 17.3785 22.5601 17.9847C22.6806 18.5908 22.9783 19.1477 23.4153 19.5847C23.8523 20.0217 24.4092 20.3194 25.0154 20.44C25.6215 20.5605 26.2499 20.4986 26.8209 20.2621C27.3919 20.0256 27.88 19.6251 28.2234 19.1112C28.5667 18.5973 28.75 17.9931 28.75 17.375C28.75 16.5462 28.4208 15.7513 27.8347 15.1653C27.2487 14.5792 26.4538 14.25 25.625 14.25Z" fill="#FF4242"/>
                <path d="M20 24.25C18.2745 24.2529 16.5792 24.7022 15.0788 25.5543C13.5784 26.4064 12.324 27.6322 11.4375 29.1125L13.575 30.3625C14.2421 29.2547 15.1842 28.3383 16.31 27.7021C17.4358 27.0659 18.7069 26.7315 20 26.7315C21.2931 26.7315 22.5642 27.0659 23.69 27.7021C24.8158 28.3383 25.7579 29.2547 26.425 30.3625L28.5625 29.1125C27.6761 27.6322 26.4216 26.4064 24.9212 25.5543C23.4208 24.7022 21.7255 24.2529 20 24.25Z" fill="#FF4242"/>
              </svg>
            ) : isReady ? (
              <svg width="80" height="80" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M42.2968 35.9474C47.3168 35.9474 51.4001 31.8691 51.4001 26.8524C51.4001 22.0808 47.6784 18.0874 42.9268 17.7624C42.6234 17.7408 42.3851 17.4974 42.3684 17.1941C42.0401 10.8774 36.8318 5.93075 30.5134 5.93075C25.9268 5.93075 21.7034 8.62409 19.7518 12.7924C19.6151 13.0841 19.2718 13.2158 18.9801 13.0941C17.5401 12.5024 16.0218 12.2024 14.4684 12.2024C7.92344 12.2024 2.59844 17.5358 2.59844 24.0908C2.59844 30.0508 7.0051 35.1441 12.8468 35.9408C13.1751 35.9841 13.4051 36.2874 13.3601 36.6158C13.3151 36.9441 13.0184 37.1891 12.6834 37.1291C6.2501 36.2541 1.39844 30.6474 1.39844 24.0908C1.39844 16.8741 7.26177 11.0024 14.4668 11.0024C15.9901 11.0024 17.4818 11.2641 18.9118 11.7824C21.1551 7.48075 25.6484 4.73242 30.5101 4.73242C37.2934 4.73242 42.9134 9.91076 43.5268 16.6158C48.6551 17.2291 52.5984 21.6291 52.5984 26.8541C52.6001 32.5291 47.9784 37.1491 42.2968 37.1491C42.2818 37.1491 42.1501 37.1424 42.1351 37.1408C41.8101 37.1158 41.5151 36.8358 41.5318 36.5108C41.5468 36.1908 41.7651 35.9358 42.0818 35.9358C42.0868 35.9358 42.0918 35.9358 42.0951 35.9358L42.2968 35.9474Z" fill="#44e3c9"/>
                <path d="M27.6001 48.6657H26.4001V21.7808L17.4234 30.7574L16.5768 29.9074L27.0001 19.4841L37.4251 29.9074L36.5751 30.7574L27.6001 21.7808V48.6657Z" fill="#44e3c9"/>
              </svg>
            ) : (
              <svg width="80" height="80" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M42.2968 35.9474C47.3168 35.9474 51.4001 31.8691 51.4001 26.8524C51.4001 22.0808 47.6784 18.0874 42.9268 17.7624C42.6234 17.7408 42.3851 17.4974 42.3684 17.1941C42.0401 10.8774 36.8318 5.93075 30.5134 5.93075C25.9268 5.93075 21.7034 8.62409 19.7518 12.7924C19.6151 13.0841 19.2718 13.2158 18.9801 13.0941C17.5401 12.5024 16.0218 12.2024 14.4684 12.2024C7.92344 12.2024 2.59844 17.5358 2.59844 24.0908C2.59844 30.0508 7.0051 35.1441 12.8468 35.9408C13.1751 35.9841 13.4051 36.2874 13.3601 36.6158C13.3151 36.9441 13.0184 37.1891 12.6834 37.1291C6.2501 36.2541 1.39844 30.6474 1.39844 24.0908C1.39844 16.8741 7.26177 11.0024 14.4668 11.0024C15.9901 11.0024 17.4818 11.2641 18.9118 11.7824C21.1551 7.48075 25.6484 4.73242 30.5101 4.73242C37.2934 4.73242 42.9134 9.91076 43.5268 16.6158C48.6551 17.2291 52.5984 21.6291 52.5984 26.8541C52.6001 32.5291 47.9784 37.1491 42.2968 37.1491C42.2818 37.1491 42.1501 37.1424 42.1351 37.1408C41.8101 37.1158 41.5151 36.8358 41.5318 36.5108C41.5468 36.1908 41.7651 35.9358 42.0818 35.9358C42.0868 35.9358 42.0918 35.9358 42.0951 35.9358L42.2968 35.9474Z" fill="#FF973C"/>
                <path d="M27.6001 48.6657H26.4001V21.7808L17.4234 30.7574L16.5768 29.9074L27.0001 19.4841L37.4251 29.9074L36.5751 30.7574L27.6001 21.7808V48.6657Z" fill="#FF973C"/>
              </svg>
            )}
          </div>
          <div className="space-y-2">
            <h3 className={styles.title}>
              {isDragging ? (
                t('uploader.dropMessage')
              ) : isAnalyzing ? (
                t('status.analyzing', { count: analyzingCount })
              ) : showBodyShotError ? (
                t('uploadStep.bodyShotRequirementsNotMet')
              ) : isMaxImagesReached || acceptedCount >= minImages ? (
                t('uploader.maxImagesReached')
              ) : (
                <>
                  {(() => {
                    const baseMin = UPLOAD_CONSTANTS.MIN_IMAGES
                    const currentCount = acceptedFiles?.length ?? 0
                    if (currentCount === 0) {
                      return t('uploader.dragDropMessage', { count: baseMin })
                    }
                    const remainingToBase = Math.max(baseMin - currentCount, 0)
                    if (remainingToBase > 0) {
                      return t('uploader.dragDropMoreMessage', { count: remainingToBase })
                    }
                    return t('uploader.dragDropMessage', { count: baseMin })
                  })()}{' '}
                  <span className={styles.browse}>{t('uploader.browse')}</span>
                </>
              )}
            </h3>
            <p className={styles.subtitle}>
              {isAnalyzing 
                ? t('status.checkingQuality')
                : showBodyShotError
                  ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon variant="cross" size={16} />{bodyErrorMessage}</span>)
                  : t('uploader.supportedFormats')
              }
            </p>
          </div>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg, image/png"
        multiple
        className={styles.hiddenInput}
        onChange={handleFileInputChange}
        disabled={isFullyDisabled}
      />
    </div>
  )
})