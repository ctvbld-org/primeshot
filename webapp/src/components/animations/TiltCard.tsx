import { Card } from "@primeshot/common/web/ui/card";
import { forwardRef, useState, useEffect, useRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TiltCardProps extends HTMLAttributes<HTMLDivElement> {
  max?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
}

export const TiltCard = forwardRef<HTMLDivElement, TiltCardProps>(({
  children,
  className,
  max = 5,
  perspective = 1000,
  scale = 1,
  speed = 1000,
  ...props
}, ref) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * max * -1;
      const rotateY = ((x - centerX) / centerX) * max;

      setTransform(
        `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`
      );
    };

    const handleMouseLeave = () => {
      setTransform('');
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [max, perspective, scale]);

  return (
    <Card
      ref={cardRef}
      className={cn(className)}
      style={{
        transform: transform || `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`,
        transition: `transform ${speed}ms cubic-bezier(.03,.98,.52,.99)`,
      }}
      {...props}
    >
      {children}
    </Card>
  );
});

TiltCard.displayName = 'TiltCard'; 