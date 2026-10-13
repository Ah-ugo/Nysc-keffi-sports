import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import {
  CloudinaryTransformPreset,
  getCloudinaryOptimizedUrl,
} from '../services/cloudinaryService';

interface CampImageProps {
  imageUrl: string;
  imagePublicId: string;
  alt: string;
  preset?: CloudinaryTransformPreset;
  className?: string;
}

export const CampImage: React.FC<CampImageProps> = ({
  imageUrl,
  imagePublicId,
  alt,
  preset = 'card',
  className = '',
}) => {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = getCloudinaryOptimizedUrl(imageUrl, imagePublicId, preset);

  if (failed || !resolvedSrc) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0B3B24] to-[#14291E] text-stone-200 p-6 text-center ${className}`}
      >
        <Trophy className="w-8 h-8 text-[#D4AF37] mb-2 opacity-90" />
        <span className="text-xs font-medium tracking-tight opacity-85 line-clamp-2">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
