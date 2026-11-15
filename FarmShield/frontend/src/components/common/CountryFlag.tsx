import React, { useState } from 'react';

interface CountryFlagProps {
  countryCode: string;
  countryName?: string;
  flagEmoji?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  countryCode,
  countryName = '',
  flagEmoji = '🌍',
  size = 'sm',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const code = (countryCode || '').toLowerCase();

  const sizeClasses = {
    xs: 'w-4 h-3 text-xs',
    sm: 'w-5 h-3.5 text-sm',
    md: 'w-6 h-4 text-base',
    lg: 'w-8 h-5.5 text-lg',
  };

  if (!code || imgError) {
    return (
      <span className={`inline-flex items-center justify-center leading-none ${className}`} title={countryName}>
        {flagEmoji}
      </span>
    );
  }

  return (
    <img
      src={`/flags/${code}.png`}
      alt={countryName ? `${countryName} flag` : `${countryCode} flag`}
      onError={() => setImgError(true)}
      className={`inline-block object-cover rounded-xs border border-black/10 shrink-0 ${sizeClasses[size]} ${className}`}
      loading="lazy"
    />
  );
};

