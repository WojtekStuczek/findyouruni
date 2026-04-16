import { useState, useEffect, useRef } from 'react';
import { Info, Search, X, Heart, ListFilter as Filter, GraduationCap } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCountry: string;
  selectedSpecialization: string;
  allCountries: string[];
  allSpecializations: string[];
  onFilterApply: (country: string, specialization: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  showHelpPrompt: boolean;
  onGoToAbout: () => void;
}

export function Header({
  searchQuery,
  onSearchChange,
  selectedCountry,
  selectedSpecialization,
  allCountries,
  allSpecializations,
  onFilterApply,
  showFavoritesOnly,
  onToggleFavorites,
  showHelpPrompt,
  onGoToAbout,
}: HeaderProps) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  return (
    <header className="z-[1001] border-b px-4 md:px-6 py-3 md:py-4 shadow-sm flex flex-row items-center justify-between gap-2 md:gap-4 bg-white/90 border-slate-200 text-slate-900 backdrop-blur-md" role="banner">
      <div className={`flex items-center gap-2 md:gap-3 ${isMobileSearchOpen ? 'hidden md:flex' : 'flex'}`}>
        <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg shadow-blue-200 shadow-lg shrink-0">
          <GraduationCap className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base md:text-xl font-bold tracking-tight leading-none">
            University Finder
          </h1>
        </div>
      </div>

      <div className={`flex items-center gap-2 ${isMobileSearchOpen ? 'w-full md:w-auto' : 'w-auto'} justify-end`}>
        <div className={`flex items-center gap-2 ${isMobileSearchOpen ? 'w-full' : ''}`}>
          {!isMobileSearchOpen && (
            <button
              onClick={onGoToAbout}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm relative"
              aria-label="About this site"
            >
              <Info className="w-4 h-4" />
              About
              {showHelpPrompt && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#ff0000] border-2 border-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.8)]"></span>
              )}
            </button>
          )}
          <div className={`relative ${isMobileSearchOpen ? 'flex-1' : 'md:flex-1 md:w-64'}`}>
            {!isMobileSearchOpen && (
              <div className="md:hidden flex items-center gap-2">
                <button
                  onClick={onGoToAbout}
                  className="p-2 rounded-xl transition-all bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center w-[36px] h-[36px] shadow-sm relative"
                  aria-label="About this site"
                >
                  <Info className="w-4 h-4" />
                  {showHelpPrompt && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#ff0000] border-2 border-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.8)]"></span>
                  )}
                </button>
                <button
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="p-2 rounded-xl border transition-all bg-slate-100 border-slate-200 text-slate-600 flex items-center justify-center w-[36px] h-[36px]"
                  aria-label="Open search"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className={`${isMobileSearchOpen ? 'block' : 'hidden md:block'} relative w-full`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search university or country..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-xl text-sm border transition-all outline-none focus:ring-2 focus:ring-blue-500 bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400"
                aria-label="Search universities by name or country"
              />
              {searchQuery ? (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              ) : isMobileSearchOpen ? (
                <button
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 md:hidden"
                  aria-label="Close search"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              ) : null}
            </div>
          </div>

          <div className={`relative ${isMobileSearchOpen ? 'hidden' : 'block'}`}>
            <button
              onClick={onToggleFavorites}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center w-[36px] h-[36px] ${
                showFavoritesOnly
                  ? 'bg-red-50 border-red-200 text-red-500'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
              aria-label={showFavoritesOnly ? 'Show all universities' : 'Show favorites only'}
            >
              <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className={`relative ${isMobileSearchOpen ? 'hidden' : 'block'}`}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center w-[36px] h-[36px] ${
                selectedCountry || selectedSpecialization
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
              aria-label="Open filters"
            >
              <Filter className="w-4 h-4" />
              {(selectedCountry || selectedSpecialization) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            {isFilterOpen && (
              <FilterDropdown
                selectedCountry={selectedCountry}
                selectedSpecialization={selectedSpecialization}
                allCountries={allCountries}
                allSpecializations={allSpecializations}
                onApply={onFilterApply}
                onClose={() => setIsFilterOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
