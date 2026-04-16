import { useState, useEffect, useRef } from 'react';
import { cloudinaryUrls } from '../data';
import type { University } from '../types';

interface UniversityImageProps {
  uni: University;
  rank: number | string;
  isHighRank: boolean;
  rankTextClass: string;
  className?: string;
}

export function UniversityImage({ uni, rank, isHighRank, rankTextClass, className = '' }: UniversityImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [uni.europe_rank]);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, [uni.europe_rank]);

  const photoUrl = cloudinaryUrls[uni.europe_rank as keyof typeof cloudinaryUrls]?.thumb?.replace('w_200,h_150', 'w_80,h_80').replace('q_auto', 'q_auto:low');

  if (error || !photoUrl) {
    return (
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-sm transition-transform group-hover:scale-110 ${rankTextClass} ${
        isHighRank ? 'bg-amber-500 text-white' : 'bg-blue-50 text-blue-600'
      } ${className}`}>
        {rank}
      </div>
    );
  }

  return (
    <div className={`w-10 h-10 rounded-xl shrink-0 overflow-hidden shadow-sm relative ${className}`}>
      {!loaded && <div className="absolute inset-0 bg-slate-200 animate-pulse" />}
      <img
        ref={imgRef}
        src={photoUrl}
        alt={`Campus of ${uni.name}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
