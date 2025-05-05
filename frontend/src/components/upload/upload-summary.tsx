import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'

interface UploadSummaryProps {
  acceptedFiles: File[]
  totalFiles: number
  qualityResults: Record<string, { score: number; isAcceptable: boolean }>
}

export function UploadSummary({ 
  acceptedFiles, 
  totalFiles, 
  qualityResults 
}: UploadSummaryProps) {
  const { t } = useTranslation('upload')

  const averageScore = acceptedFiles.length > 0
    ? (acceptedFiles
        .reduce((sum, file) => sum + (qualityResults[file.name]?.score || 0), 0) / acceptedFiles.length)
    : 0

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{t('fields.overallQualityScore')}</h3>
            {acceptedFiles.length > 0 && (
              <span className={cn(
                "text-sm font-medium",
                acceptedFiles.length >= UPLOAD_CONSTANTS.MIN_IMAGES ? "text-green-600" : "text-yellow-600"
              )}>
                {averageScore.toFixed(1)}%
              </span>
            )}
          </div>

          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all",
                acceptedFiles.length >= UPLOAD_CONSTANTS.MIN_IMAGES ? "bg-green-600" : "bg-yellow-600"
              )}
              style={{ width: `${averageScore}%` }}
            ></div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('fields.totalImages')}</span>
              <span>{totalFiles}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t('fields.acceptedImagesCount')}</span>
              <span className="text-green-600">{acceptedFiles.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t('fields.rejectedImagesCount')}</span>
              <span className="text-red-600">
                {totalFiles - acceptedFiles.length}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 