'use client';

import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoCarouselProps {
  photos: { url: string; order: number }[];
}

export function PhotoCarousel({ photos }: PhotoCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    dragFree: false,
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-rose-950/50 to-neutral-900 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">📸</span>
          </div>
          <p className="text-white/60 text-sm">No photos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full select-none">
      {/* Carousel viewport */}
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {photos.map((photo, index) => (
            <div key={index} className="flex-none w-full h-full relative">
              <img
                src={photo.url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
                loading={index < 2 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tap zones for navigation */}
      <div className="absolute inset-0 flex z-10 pointer-events-none">
        <div
          className="w-1/3 h-full pointer-events-auto cursor-pointer"
          onClick={scrollPrev}
          role="button"
          aria-label="Previous photo"
        />
        <div className="w-1/3 h-full" />
        <div
          className="w-1/3 h-full pointer-events-auto cursor-pointer"
          onClick={scrollNext}
          role="button"
          aria-label="Next photo"
        />
      </div>

      {/* Navigation arrows - show on hover/desktop */}
      {selectedIndex > 0 && (
        <button
          onClick={scrollPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 sm:opacity-60 sm:hover:opacity-100"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}
      {selectedIndex < photos.length - 1 && (
        <button
          onClick={scrollNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 sm:opacity-60 sm:hover:opacity-100"
          aria-label="Next photo"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Pagination dots */}
      {photos.length > 1 && (
        <div className="absolute top-3 left-0 right-0 z-20 flex justify-center gap-1.5 px-4">
          {photos.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? 'w-6 bg-white'
                  : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
