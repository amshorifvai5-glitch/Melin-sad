import React from 'react';

interface AvatarProps {
  src: string | null;
  alt: string;
  initials?: string;
  sizeClass?: string;
  roundedClass?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  initials = 'SA',
  sizeClass = 'w-11 h-11',
  roundedClass = 'rounded-full',
}) => {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className={`${sizeClass} ${roundedClass} object-cover bg-slate-800 border border-slate-200/70`}
      />
    );
  }

  return (
    <div
      aria-label={alt}
      className={`${sizeClass} ${roundedClass} bg-[#F26522] text-white font-semibold flex items-center justify-center tracking-tight select-none shrink-0`}
    >
      {initials}
    </div>
  );
};
