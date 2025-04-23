import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/icons/icon'
import styles from './style-details.module.css'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StyleDetailsProps {
  style: {
    name: string;
    tagline?: string;
    description: string;
    genderSpecificImages?: string[];
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
  
  if (isCard) {
    return (
      <>
        {/* Image Strip */}
        <motion.div 
          className="flex h-[200px] w-full"
          variants={stripVariants}
          initial="hidden"
          animate="show"
        >
          {images.slice(0, 3).map((imgSrc, idx) => (
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

        <div className="p-6">
          {/* Header with Style Name and Photo Count */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-semibold">{style.name}</h3>
            </div>
            {headshotsPerStyle && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Icon variant="camera" size={16} />
                <span>{headshotsPerStyle}</span>
              </div>
            )}
          </div>

          {/* Tagline */}
          <div className="flex flex-wrap gap-2 mb-4">
            {style.tagline && (
              <span className="text-lg font-medium">
                {style.tagline}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground">
            {style.description}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Image Strip */}
      <motion.div 
        className={styles['image-strip']}
        variants={stripVariants}
        initial="hidden"
        animate="show"
      >
        {images.slice(0, 5).map((imgSrc, idx) => (
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
        className={styles['content-container']}
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
            <h2 className={styles['style-label']}>Style</h2>
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
        </div>
      </motion.div>
    </>
  );
} 