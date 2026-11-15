import React, { useState } from 'react';
import { ImageOff, Sparkles, Sprout } from 'lucide-react';
import { CountryFlag } from './CountryFlag';

interface CountryAgricultureImageProps {
  countryCode: string;
  countryName: string;
  flagEmoji?: string;
  imageUrl?: string;
  caption?: string;
  agricultureSubject?: string;
  sourceAttribution?: string;
  className?: string;
  aspectRatio?: 'video' | 'wide' | 'square' | 'portrait';
  showOverlay?: boolean;
}

export const CountryAgricultureImage: React.FC<CountryAgricultureImageProps> = ({
  countryCode,
  countryName,
  flagEmoji = '🌍',
  imageUrl,
  caption,
  agricultureSubject,
  sourceAttribution,
  className = '',
  aspectRatio = 'video',
  showOverlay = true,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const code = (countryCode || 'et').toLowerCase();
  const effectiveImageUrl = imageUrl || `/country_images/${code}.jpg`;

  const aspectClasses = {
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
  };

  return (
    <div
      className={`relative w-full ${aspectClasses[aspectRatio]} bg-[#18251D] rounded-xl overflow-hidden border border-[#2B4031]/20 shadow-natural-sm group ${className}`}
    >
      {/* Loading Skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A3326] via-[#2B4031]/30 to-[#1A3326] animate-pulse flex flex-col items-center justify-center p-3 text-center">
          <CountryFlag countryCode={countryCode} countryName={countryName} flagEmoji={flagEmoji} size="lg" />
          <span className="text-xs font-semibold text-[#A6C487] mt-2">Loading {countryName} agronomic terrain...</span>
        </div>
      )}

      {/* Main Image */}
      {!error && (
        <img
          src={effectiveImageUrl}
          alt={caption || `Agricultural landscape and territory of ${countryName}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            // Try PNG fallback if JPG fails
            if (effectiveImageUrl.endsWith('.jpg')) {
              const fallbackUrl = `/country_images/${code}.png`;
              if (effectiveImageUrl !== fallbackUrl) {
                const img = new Image();
                img.src = fallbackUrl;
                img.onload = () => {
                  setLoaded(true);
                };
                img.onerror = () => setError(true);
                return;
              }
            }
            setError(true);
          }}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
        />
      )}

      {/* Fallback Display if image missing/error */}
      {error && (
        <div className="absolute inset-0 bg-[#1A3326] flex flex-col items-center justify-center p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[#2B4031] flex items-center justify-center mb-2 border border-[#A6C487]/30 shadow-natural-xs">
            <CountryFlag countryCode={countryCode} countryName={countryName} flagEmoji={flagEmoji} size="lg" />
          </div>
          <span className="text-xs font-bold text-[#E5EBDD]">{countryName}</span>
          <span className="text-[10px] text-[#A6C487]/80 mt-0.5">Agricultural Observation Territory</span>
          <div className="mt-2 flex items-center gap-1 text-[9px] text-[#D48756] bg-[#2B4031]/50 px-2 py-0.5 rounded-full">
            <ImageOff className="w-3 h-3" />
            <span>Local satellite scene pending</span>
          </div>
        </div>
      )}

      {/* Gradient Vignette & Overlay */}
      {showOverlay && loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-between p-2.5 pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2 py-1 rounded-lg border border-white/10">
              <CountryFlag countryCode={countryCode} countryName={countryName} flagEmoji={flagEmoji} size="xs" />
              <span className="text-[11px] font-bold text-white tracking-wide">{countryName}</span>
            </div>

            {agricultureSubject && (
              <span className="text-[9px] font-bold text-[#E5EBDD] bg-[#2B4031]/85 backdrop-blur-xs px-2 py-0.5 rounded-md border border-[#A6C487]/40 flex items-center gap-1">
                <Sprout className="w-2.5 h-2.5 text-[#D48756]" />
                {agricultureSubject}
              </span>
            )}
          </div>

          <div>
            {caption && (
              <p className="text-[10px] text-[#E5EBDD] line-clamp-1 font-medium drop-shadow-xs">
                {caption}
              </p>
            )}
            {sourceAttribution && (
              <p className="text-[8px] text-white/60 font-mono mt-0.5">
                Source: {sourceAttribution}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

