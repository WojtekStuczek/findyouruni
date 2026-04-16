import React from 'react';
import { Heart, ChevronRight } from 'lucide-react';
import { UniversityImage } from './UniversityImage';
import { getCountryCode } from '../utils/countryCode';
import { getNumericRank } from '../utils/rank';
import type { UniversityRowData } from '../types';

interface UniversityRowProps extends UniversityRowData {
  index: number;
  style: React.CSSProperties;
}

export const UniversityRow = (props: UniversityRowProps): React.ReactElement => {
  const { index, style, items, rankingMode, favorites, focusUniversity, toggleFavorite } = props;
  const uni = items[index];

  const rank = rankingMode === 'europe' ? uni.europe_rank : uni.world_rank;
  const isHighRank = rankingMode === 'europe' ? getNumericRank(uni.europe_rank) <= 10 : getNumericRank(uni.world_rank) <= 50;
  const isTwoPartWorldRank = rankingMode === 'world' && typeof uni.world_rank === 'string' && uni.world_rank.includes('-');
  const rankTextClass = isTwoPartWorldRank ? 'text-[10px] tracking-tighter leading-none text-center px-0.5' : 'text-xs';

  return (
    <div
      style={style}
      onClick={() => focusUniversity(uni)}
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          focusUniversity(uni);
        }
      }}
      className="w-full text-left px-4 border-b transition-all group flex items-center gap-4 border-slate-50 hover:bg-blue-50/50 cursor-pointer"
    >
      <UniversityImage
        uni={uni}
        rank={rank}
        isHighRank={isHighRank}
        rankTextClass={rankTextClass}
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate text-slate-900">
          {uni.name}
        </p>
        <p className="text-xs flex items-center gap-1.5 mt-0.5 text-slate-500">
          <img src={`https://flagcdn.com/w40/${getCountryCode(uni.country)}.png`} alt={`Flag of ${uni.country}`} className="w-4 h-auto rounded-[2px] shadow-sm" loading="lazy" />
          <span>{uni.country}</span>
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            World: #{uni.world_rank}
          </span>
          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
            Europe: #{uni.europe_rank}
          </span>
        </div>
      </div>
      <button
        onClick={(e) => toggleFavorite(e, uni.europe_rank)}
        className="p-2 -mr-2 text-slate-300 hover:text-red-500 transition-colors"
        aria-label={favorites.includes(uni.europe_rank) ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart className={`w-4 h-4 ${favorites.includes(uni.europe_rank) ? 'fill-red-500 text-red-500' : ''}`} />
      </button>
      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 text-slate-300" />
    </div>
  );
};
