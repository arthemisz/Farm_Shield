import React, { useState } from 'react';
import { Globe2 } from 'lucide-react';

interface CountryVisualProps {
  countryCode: string;
  countryName: string;
  flagEmoji?: string;
  imageSrc?: string;
  caption?: string;
  aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
  className?: string;
  showFlagOverlay?: boolean;
}

export const CountryVisual: React.FC<CountryVisualProps> = ({
  countryCode,
  countryName,
  flagEmoji,
  imageSrc,
  caption,
  aspectRatio = 'video',
  className = '',
  showFlagOverlay = true
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [flagError, setFlagError] = useState(false);

  const codeLower = (countryCode || 'et').toLowerCase();
  const flagPath = `/flags/${codeLower}.png`;
  const primaryImg = imageSrc || `/country_images/${codeLower}.jpg`;

  const ratioClass =
    aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'wide'
      ? 'aspect-[21/9]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : '';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#24392B]/90 border border-[#2B4031]/15 shadow-natural-xs ${ratioClass} ${className}`}
    >
      {/* Background Graphic or Loading Fallback */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#2B4031]/20 animate-pulse">
          <Globe2 className="w-8 h-8 text-[#72966F]/50 animate-spin" />
        </div>
      )}

      {/* Primary Geographic Image */}
      {!imageError ? (
        <img
          src={primaryImg}
          alt={`Landscape and geography of ${countryName}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            // If .jpg fails, check if .png exists or fall back
            if (!primaryImg.endsWith('.png')) {
              // Try png variant
              setImageError(false);
              const img = new Image();
              img.src = `/country_images/${codeLower}.png`;
              img.onload = () => setImageLoaded(true);
              img.onerror = () => setImageError(true);
            } else {
              setImageError(true);
            }
          }}
          className={`w-full h-full object-cover transition-all duration-500 ${
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          loading="lazy"
        />
      ) : (
        /* Graceful Fallback: High-resolution national flag on subtle topographic backdrop */
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#2B4031] to-[#18251D] text-white text-center">
          {!flagError ? (
            <img
              src={flagPath}
              alt={`National flag of ${countryName}`}
              onError={() => setFlagError(true)}
              className="w-16 h-10 object-contain rounded shadow-natural-sm mb-2"
            />
          ) : (
            <span className="text-4xl mb-2">{flagEmoji || '🌍'}</span>
          )}
          <span className="text-xs font-bold text-[#FFFEFA]">{countryName}</span>
          <span className="text-[10px] text-[#A9C4A6]">Territorial Geographic Context</span>
        </div>
      )}

      {/* Soft gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

      {/* Flag Badge & Country Identification Overlay */}
      {showFlagOverlay && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-7 h-5 rounded overflow-hidden shadow-2xs border border-white/40 shrink-0 bg-black/40 flex items-center justify-center">
              {!flagError ? (
                <img
                  src={flagPath}
                  alt={`${countryName} flag`}
                  onError={() => setFlagError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs">{flagEmoji || '🌍'}</span>
              )}
            </div>
            <span className="font-bold text-xs tracking-tight text-[#FFFEFA] drop-shadow-sm truncate">
              {countryName}
            </span>
          </div>

          <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-xs text-[10px] font-mono font-bold text-[#E5EBDD] border border-white/20">
            {countryCode.toUpperCase()}
          </span>
        </div>
      )}

      {/* Optional Top Attribution Tag */}
      {caption && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] text-[#E5EBDD] border border-white/10 pointer-events-none truncate max-w-[70%]">
          {caption}
        </div>
      )}
    </div>
  );
};
