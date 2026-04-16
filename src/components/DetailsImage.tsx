import { useState, useEffect, useRef } from 'react';
import { GraduationCap } from 'lucide-react';
import { cloudinaryUrls } from '../data';
import type { University } from '../types';

interface DetailsImageProps {
  uni: University;
}

export function DetailsImage({ uni }: DetailsImageProps) {
  const [error, setError] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setError(false);
    setFullLoaded(false);
  }, [uni.europe_rank]);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setFullLoaded(true);
    }
  }, [uni.europe_rank]);

  const thumbUrl = cloudinaryUrls[uni.europe_rank as keyof typeof cloudinaryUrls]?.thumb;
  const fullUrl = cloudinaryUrls[uni.europe_rank as keyof typeof cloudinaryUrls]?.full;

  if (error || !thumbUrl || !fullUrl) {
    return (
      <div className="w-full h-48 rounded-xl shadow-md mb-6 bg-blue-50 flex items-center justify-center border border-blue-100">
        <GraduationCap className="w-16 h-16 text-blue-200" />
      </div>
    );
  }

  return (
    <div className="w-full h-48 rounded-xl shadow-md mb-6 overflow-hidden relative">
      <img
        src={thumbUrl}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover scale-110 blur-sm transition-opacity duration-500 ${fullLoaded ? 'opacity-0' : 'opacity-100'}`}
      />
      <img
        ref={imgRef}
        key={uni.europe_rank}
        src={fullUrl}
        alt={`Campus of ${uni.name}, ${uni.country}`}
        onLoad={() => setFullLoaded(true)}
        onError={() => setError(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${fullLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
