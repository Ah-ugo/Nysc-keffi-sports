import React from 'react';

interface NYSCLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

/**
 * Authentic Official National Youth Service Corps (NYSC) Emblem
 * Direct official vector logo from National Youth Service Corps.
 */
export const NYSCLogo: React.FC<NYSCLogoProps> = ({
  className = '',
  size = 40,
  showText = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/nysc-logo.svg"
        alt="National Youth Service Corps (NYSC) Official Emblem"
        width={size}
        height={Math.round(size * 1.26)}
        className="shrink-0 object-contain select-none"
        style={{ width: `${size}px`, height: 'auto', maxHeight: `${Math.round(size * 1.25)}px` }}
      />
      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-emerald-400">
            NYSC Keffi Camp
          </span>
          <span className="text-sm font-bold text-white tracking-tight">
            Charity Lottery
          </span>
        </div>
      )}
    </div>
  );
};
