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
        className="p-8"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ 
          duration: 0.6,
          delay: 0.3,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      >
        {/* Style Name and Customize Button */}
        <div className="flex justify-start items-center mb-[56px]">
          <h2 className="text-[2rem] font-light text-[#C0C7C6] flex-1 max-w-[180px]">Style</h2>
          <h3 className="text-[2rem] font-bold text-black flex-1 tracking-tight">{style.name}</h3>
          <Button 
            variant="primary"
            onClick={() => {
              setIsNavigating(false);
              onCustomize(index);
            }}
          >
            Customise
          </Button>
        </div>

        {/* Description */}
        <div className="flex justify-start items-end mb-4">
          <div className="flex flex-1 justify-start items-start">
            <div className="flex-1 max-w-[180px]">
              <p className="text-[15px] font-semibold text-black leading-[18px] max-w-[100px]">
                {style.tagline || style.name}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-[#909594] text-[15px] leading-[22px] max-w-[360px]">
                {style.description}
              </p>
            </div>
          </div>
          <div className="flex gap-2 text-[#00000060]">
            <Icon
              variant="background"
              size={28}
              className="p-2 box-content"
            />
            <Icon
              variant="clothingColor"
              size={28}
              className="p-2 box-content"
            />
            <Icon
              variant="clothing"
              size={28}
              className="p-2 box-content"
            />
          </div>
        </div>
      </motion.div>
    </>
  );
} 