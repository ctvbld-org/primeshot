import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/icons/icon'
import styles from './style-details.module.css'
import { motion } from 'framer-motion'

interface StyleDetailsProps {
  style: {
    name: string;
    tagline?: string;
    description: string;
    genderSpecificImages: string[];
  };
  index: number;
  onCustomize: (index: number) => void;
  setIsNavigating: (value: boolean) => void;
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
  setIsNavigating
}: StyleDetailsProps) {
  return (
    <>
      {/* Image Strip */}
      <motion.div 
        className={styles['image-strip']}
        variants={stripVariants}
        initial="hidden"
        animate="show"
      >
        {style.genderSpecificImages.slice(0, 5).map((imgSrc, idx) => (
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