import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from './Iconsax';

interface CarouselProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
}

export const Carousel: React.FC<CarouselProps> = ({
  children,
  title,
  subtitle,
  badge,
  action,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [children]);

  const scroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const scrollAmount = Math.min(el.clientWidth * 0.8, 600);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative my-6 w-full overflow-hidden">
      {/* Header */}
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <div>
            {badge && (
              <span className="inline-block text-[11px] font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                {badge}
              </span>
            )}
            {title && (
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {action}
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Previous"
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  canScrollLeft
                    ? 'bg-[#1E2520] text-white hover:bg-[#27322A] border border-[#2B382F]'
                    : 'bg-[#151916] text-stone-600 border border-[#1E2420] cursor-not-allowed opacity-40'
                }`}
              >
                <ArrowLeftIcon size={16} />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Next"
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  canScrollRight
                    ? 'bg-[#1E2520] text-white hover:bg-[#27322A] border border-[#2B382F]'
                    : 'bg-[#151916] text-stone-600 border border-[#1E2420] cursor-not-allowed opacity-40'
                }`}
              >
                <ArrowRightIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track */}
      <div
        ref={containerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-3 pt-1 no-scrollbar w-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </div>
  );
};
