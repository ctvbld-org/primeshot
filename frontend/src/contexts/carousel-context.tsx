import React, { createContext, useContext, useState } from 'react';

interface CarouselContextType {
  isChangingSlide: boolean;
  setIsChangingSlide: (changing: boolean) => void;
}

const CarouselContext = createContext<CarouselContextType | null>(null);

export function useCarouselContext() {
  const context = useContext(CarouselContext);
  if (!context) {
    throw new Error('useCarouselContext must be used within a CarouselProvider');
  }
  return context;
}

export function CarouselProvider({ children }: { children: React.ReactNode }) {
  const [isChangingSlide, setIsChangingSlide] = useState(false);

  return (
    <CarouselContext.Provider value={{ isChangingSlide, setIsChangingSlide }}>
      {children}
    </CarouselContext.Provider>
  );
} 