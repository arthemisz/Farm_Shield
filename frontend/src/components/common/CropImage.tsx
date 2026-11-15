import React from 'react';
import { Sprout } from 'lucide-react';

interface CropImageProps {
  cropId: string;
  cropName: string;
  scientificName?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
}

export const CropImage: React.FC<CropImageProps> = ({
  cropId,
  cropName,
  scientificName,
  className = '',
  aspectRatio = 'video',
}) => {
  const [error, setError] = React.useState(false);
  const cleanId = (cropId || 'teff').toLowerCase().replace(/\s+/g, '_');
  // Check mapped webp images from Phase 4.7
  const webpAvailable = [
    'teff', 'wheat', 'bread_wheat', 'maize', 'sorghum', 'barley',
    'faba_bean', 'common_bean', 'sweet_potato', 'coffee', 'cotton',
    'sunflower', 'sesame'
  ].includes(cleanId);
  const imageSrc = webpAvailable ? `/crop_images/${cleanId}.webp` : `/crop_images/${cleanId}.png`;

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'wide'
      ? 'aspect-[21/9]'
      : 'aspect-video';

  if (error) {
    return (
      <div
        className={`w-full ${aspectClass} rounded-2xl bg-gradient-to-br from-[#18251D] to-[#111913] border border-[#A6C487]/20 flex flex-col items-center justify-center p-4 text-center ${className}`}
      >
        <Sprout className="w-8 h-8 text-[#B5CF78] mb-2" />
        <span className="font-bold text-xs text-white">{cropName}</span>
        {scientificName && (
          <span className="text-[10px] text-[#A6C487] italic mt-0.5">{scientificName}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden border border-[#A6C487]/20 bg-[#111913] ${className}`}>
      <img
        src={imageSrc}
        alt={`Botanical illustration of ${cropName}`}
        onError={() => setError(true)}
        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-2 left-3 right-3 text-white">
        <span className="text-[11px] font-bold block truncate">{cropName}</span>
        {scientificName && (
          <span className="text-[9px] text-[#A6C487] italic block truncate">{scientificName}</span>
        )}
      </div>
    </div>
  );
};

