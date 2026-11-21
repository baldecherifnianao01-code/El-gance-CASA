import { useState } from 'react';
import { Glasses } from 'lucide-react';

interface SmartImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function SmartImage({ src, alt, className = '', fallbackTitle }: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F2EDE4] via-[#EAE2D4] to-[#DED4C3] text-[#111111]/60 p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Glasses className="w-8 h-8 mb-2 stroke-[1.35] text-[#946F2B]" />
        <span className="font-serif text-sm tracking-wide text-[#111111]/75">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
