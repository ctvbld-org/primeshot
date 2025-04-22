import { Button } from "@/components/ui/button"
import Image from "next/image"
import styles from './shoot-footer.module.css'
import { Icon } from "../icons/icon"

interface ShootFooterProps {
  stylesCount: number
  photosPerStyle: number
  basePrice: number
  extraStylesCount: number
  totalPhotosWithExtra: number
  upgradedPrice: number
  onCheckout: () => void
}

export function ShootFooter({
  stylesCount,
  photosPerStyle,
  basePrice,
  extraStylesCount,
  totalPhotosWithExtra,
  upgradedPrice,
  onCheckout
}: ShootFooterProps) {
  const totalPhotos = stylesCount * photosPerStyle

  return (
    <div className={styles.footer}>
      <div className="mx-auto flex items-center">
        <div className="flex items-center flex-[0_0_auto]">
          <span className={styles['footer-title']}>My Shoot</span>
          <span className={styles['footer-separator']}>
            <Image 
              src="/footer-separator.svg"
              alt="Footer Separator"
              width={13}
              height={64}
            />
          </span>
        </div>
        {stylesCount > 0 ? (
          <>
            <div className="flex items-center mr-10 justify-between flex-wrap flex-[1_1_80%]">
              <div className={styles['footer-content']}>
                <div className="flex items-center">
                  <span className="text-[#FFB45E] mr-1">{stylesCount}</span>
                  <span className="font-light mx-1">×</span>
                  <span className="text-[#ffffff]"> Styles</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">
                    <Icon variant="camera" size={14} className={styles.icon} />
                  </span>
                  <span className="text-[#FFB45E] mr-1">{totalPhotos}</span>
                  <span className="font-light mx-1">×</span>
                  <span className="text-[#ffffff]"> Photos</span>
                  <span className="mx-1">({photosPerStyle} per style)</span>
                </div>

                <span className="bg-[#44E3C910] rounded-full px-3 py-2 text-[#44E3C9]">
                  {basePrice / 100} USD
                </span>
              </div>
              <div className="flex items-center gap-x-1 bg-[#FFFFFF10] rounded-full px-3 py-2 text-[#FFFFFF60] text-xs">
                <Icon variant="plusFill" size={16} className="text-[#FFB45E]" />
                <span>Add {extraStylesCount} extra styles and get</span>
                <span className="text-[#FFFFFF]">{totalPhotosWithExtra}</span>
                <span>photos for only</span>
                <span className="text-[#FFFFFF]">{upgradedPrice} USD</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center mr-10 flex-wrap flex-[1_1_80%]">
              <Icon variant="dizzyFace" size={22} className="mr-2" />
              <div className={styles['footer-content']}>
                <span>Your style list is empty. Add a few looks to generate your perfect shoot.</span>
              </div>
            </div>
          </>
        )}
        <Button 
          onClick={onCheckout}
          variant="primary"
          className={styles.checkoutButton}
          disabled={stylesCount === 0}
        >
          Checkout
        </Button>
      </div>
    </div>
  )
} 