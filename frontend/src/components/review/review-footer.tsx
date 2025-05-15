import { Button } from "@/components/ui/button"
import styles from './review-footer.module.css'
import { Icon } from "../icons/icon"
import { useTranslation } from 'react-i18next'
import { useUserProgress } from '@/lib/hooks/use-user-progress';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react";

export function ReviewFooter() {
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation(['styles', 'payment'])

  const handleGenerate = async () => {
    
    setLoading(true);
    try {
     
    } catch (error) {
      
    } finally {
      setLoading(false);
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
          disabled={loading}
          loading={loading}
        >
          Generate
        </Button>
      </div>
    </div>
  )
} 