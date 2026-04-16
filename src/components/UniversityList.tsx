import { useRef, useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { List as VirtualList } from 'react-window';
import { UniversityRow } from './UniversityRow';
import type { University, UniversityRowData } from '../types';

const ITEM_HEIGHT = 88;

interface UniversityListProps {
  universities: University[];
  rankingMode: 'europe' | 'world';
  favorites: (number | string)[];
  showSidebar: boolean;
  focusUniversity: (uni: University) => void;
  toggleFavorite: (e: React.MouseEvent, rank: number | string) => void;
}

export function UniversityList({
  universities,
  rankingMode,
  favorites,
  showSidebar,
  focusUniversity,
  toggleFavorite,
}: UniversityListProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarHeight, setSidebarHeight] = useState(600);

  useEffect(() => {
    if (!sidebarRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSidebarHeight(entry.contentRect.height);
      }
    });
    ro.observe(sidebarRef.current);
    return () => ro.disconnect();
  }, []);

  const listRowProps = useMemo<UniversityRowData>(() => ({
    items: universities,
    rankingMode,
    favorites,
    focusUniversity,
    toggleFavorite,
  }), [universities, rankingMode, favorites, focusUniversity, toggleFavorite]);

  return (
    <aside aria-label="University list" className={`z-[1000] absolute inset-y-0 left-0 w-full md:w-80 lg:w-96 transition-transform duration-300 transform bg-white border-r border-slate-200 flex flex-col shadow-2xl ${
      showSidebar ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div ref={sidebarRef} className="flex-1 overflow-hidden">
        {universities.length > 0 ? (
          <VirtualList<UniversityRowData>
            defaultHeight={sidebarHeight}
            rowCount={universities.length}
            rowHeight={ITEM_HEIGHT}
            overscanCount={3}
            rowProps={listRowProps}
            rowComponent={UniversityRow}
          />
        ) : (
          <div className="p-12 text-center">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm text-slate-400">No results found for your search.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
