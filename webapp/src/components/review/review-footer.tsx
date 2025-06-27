import { Button } from "@primeshot/common/web/ui/button"
import styles from './review-footer.module.css'
import { Icon } from "../icons/icon"
import { useTranslation } from 'react-i18next'
import { useUserProgress } from '@/lib/hooks/use-user-progress';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from "@primeshot/common/web/ui/use-toast"
import { useState } from "react";

interface ReviewFooterProps {
  isLoading: boolean;
  profileComplete: boolean;
  onGenerate: () => Promise<void>;
}

export function ReviewFooter({ isLoading, profileComplete, onGenerate }: ReviewFooterProps) {
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation(['styles', 'payment'])

  const handleGenerate = async () => {
    if (loading) return; // Prevent multiple clicks
    
    setLoading(true);
    try {
      await onGenerate();
      // Don't set loading to false - let the parent component handle this
      // through redirection or explicit state reset
    } catch (error) {
      console.error('Error generating:', error);
      setLoading(false); // Only reset loading on error
    }
  };

  return (
    <div className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.countWrapper}>
          <p className={styles.countLabel}>
            My Shoot
          </p>
        </div>
        
        <span className={styles.separator} />

        <div className={styles.info}>
          
        </div>
        <Button 
          onClick={handleGenerate}
          variant="secondary"
          className={styles.checkoutButton}
          disabled={!profileComplete || loading}
          loading={isLoading || loading}
        >
          Generate
        </Button>
      </div>
    </div>
  )
} 