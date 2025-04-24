import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/icons/icon'
import styles from './style-details.module.css'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getOptionsImage } from '@/lib/utils/get-options-image'
import optionsConfig from '@/lib/config/options.json'

interface StyleDetailsProps {
  style: {
    name: string;
    tagline?: string;
    description: string;
    genderSpecificImages?: string[];
    settings?: {
      background?: string;
      clothing?: string;
      clothingColor?: string;
    };
  };
  index: number;
  onCustomize: (index: number) => void;
  setIsNavigating: (value: boolean) => void;
  isCard?: boolean;
  headshotsPerStyle?: number;
}

// Animation variants for the image strip container
const stripVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

// Animation variants for each image
const imageVariants = {
  hidden: { 
    opacity: 0.4,
  },
  show: { 
    opacity: 1,
    transition: {  
      duration: 2,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
}

export function StyleDetails({
  style,
  index,
  onCustomize,
  setIsNavigating,
  isCard,
  headshotsPerStyle
}: StyleDetailsProps) {
  const images = style.genderSpecificImages || [];
  const imgNb = isCard ? 3 : 5;

  return (
    <>
      {/* Image Strip */}
      <motion.div 
        className={`${styles['image-strip']} ${isCard ? styles['card-styling'] : ''}`}
        variants={stripVariants}
        initial="hidden"
        animate="show"
      >
        {images.slice(0, imgNb).map((imgSrc, idx) => (
          <motion.div 
            key={idx} 
            className="flex-1 relative overflow-hidden"
            variants={imageVariants}
          >
            <Image
              src={imgSrc}
              alt={`${style.name} Example ${idx + 1}`}
              fill
              className="object-cover"
              priority={idx === 0}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Content Section */}
      <motion.div 
        className={`${styles['content-container']} ${isCard ? styles['card-styling'] : ''}`}
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ 
          duration: 1,
          delay: 0,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      >
        <div className={styles.content}>
          {/* Style Name and Customize Button */}
          <div className={styles.header}>
            {isCard ? (
              headshotsPerStyle && (
                <div className={styles['style-headshots']}>
                  <Icon variant="camera" size={24} />
                  <span>{headshotsPerStyle}</span>
                </div>
              )
            ) : (
              <h2 className={styles['style-label']}>Style</h2>
            )}
            <h3 className={styles['style-name']}>{style.name}</h3>
          </div>

          {/* Description */}
          <div className={styles['description-section']}>
            <div className={styles['description-content']}>
              <div className={styles['tagline-container']}>
                <p className={styles.tagline}>
                  {style.tagline || style.name}
                </p>
              </div>
              <div className={styles['description-container']}>
                <p className={styles.description}>
                  {style.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles['button-container']}>
          {isCard ? (
            <>
              <div className={styles['icons-container']}>
                {style.settings?.background && (
                  <div className="relative w-12 h-12">
                    <Image 
                      src={getOptionsImage(optionsConfig.background.options.find(opt => opt.id === style.settings?.background)?.imageUrl || '')}
                      alt="Selected background"
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                )}
                {style.settings?.clothing && (
                  <div className="relative w-12 h-12">
                    <Image 
                      src={getOptionsImage(optionsConfig.clothing.options.find(opt => opt.id === style.settings?.clothing)?.imageUrl || '')}
                      alt="Selected clothing"
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                )}
                {style.settings?.clothingColor && (
                  <div className={`${styles['clothing-color']} w-12 h-12 rounded-full`} style={{ 
                    background: style.settings.clothingColor === '#FFFFFF' 
                      ? 'linear-gradient(153deg, rgba(0, 0, 0, 0.10) 0%, rgba(0, 0, 0, 0.00) 83.33%), linear-gradient(0deg, #FFF 0%, #FFF 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.10) 100%)' 
                      : style.settings.clothingColor 
                  }} />
                )}
              </div>
              <Button 
                variant="ghost"
                className="text-black bg-[#00000010]"
                onClick={() => {
                  onCustomize(index);
                }}
              >
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="primary"
                onClick={() => {
                  setIsNavigating(false);
                  onCustomize(index);
                }}
              >
                Customise
              </Button>
              <div className={styles['icons-container']}>
                <Icon
                  variant="background"
                  size={28}
                  className={styles.icon}
                />
                <Icon
                  variant="clothingColor"
                  size={28}
                  className={styles.icon}
                />
                <Icon
                  variant="clothing"
                  size={28}
                  className={styles.icon}
                />
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
} 