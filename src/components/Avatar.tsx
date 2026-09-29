import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  name?: string;
  className?: string;
}

/** Profile picture with an initials fallback when there's no photo (or it fails to load). */
export const Avatar: React.FC<AvatarProps> = ({ src, name = '', className = 'w-10 h-10 rounded-lg' }) => {
  const [failed, setFailed] = useState(false);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '?';

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <span
      aria-label={name}
      className={`${className} flex-shrink-0 bg-brand-container-high border border-white/10 text-brand-volt font-mono font-bold flex items-center justify-center select-none`}
    >
      <span className="text-[0.8em]">{initials}</span>
    </span>
  );
};
