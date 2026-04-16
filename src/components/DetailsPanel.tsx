import { useState, useEffect } from 'react';
import { X, Globe, Plane, Train, Heart, Share2, Check } from 'lucide-react';
import { DetailsImage } from './DetailsImage';
import { TravelEstimator } from './TravelEstimator';
import { getCountryCode } from '../utils/countryCode';
import type { University } from '../types';

interface DetailsPanelProps {
  selectedUni: University | null;
  favorites: (number | string)[];
  onClose: () => void;
  toggleFavorite: (e: React.MouseEvent, rank: number | string) => void;
}

export function DetailsPanel({ selectedUni, favorites, onClose, toggleFavorite }: DetailsPanelProps) {
  const [displayedUni, setDisplayedUni] = useState<University | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFlightWidget, setShowFlightWidget] = useState(false);

  useEffect(() => {
    if (selectedUni) {
      setDisplayedUni(selectedUni);
      setShowFlightWidget(false);
      setTimeout(() => {
        const container = document.getElementById('details-scroll-container');
        if (container) container.scrollTop = 0;
      }, 10);
    }
  }, [selectedUni]);

  useEffect(() => {
    (window as Window & { openFlightsModal?: () => void }).openFlightsModal = () => {
      setShowFlightWidget(true);
    };
    return () => {
      delete (window as Window & { openFlightsModal?: () => void }).openFlightsModal;
    };
  }, []);

  const handleShare = () => {
    if (displayedUni) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!displayedUni) return null;

  return (
    <aside aria-label="University details" className={`z-[1000] absolute inset-y-0 right-0 w-full md:w-80 lg:w-96 transition-transform duration-300 transform bg-white border-l border-slate-200 flex flex-col shadow-2xl ${
      selectedUni ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <h2 className="font-bold text-sm uppercase tracking-wider text-slate-500">
          University Details
        </h2>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close details panel">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div id="details-scroll-container" className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-28 md:pb-6">
        <DetailsImage uni={displayedUni} />
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <img src={`https://flagcdn.com/w40/${getCountryCode(displayedUni.country)}.png`} alt={`Flag of ${displayedUni.country}`} width="40" height="30" className="w-10 h-auto rounded-sm shadow-md" />
            <h2 className="text-2xl font-bold leading-tight text-slate-900">{displayedUni.name}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors shrink-0 relative group"
              aria-label="Copy link to share"
            >
              {copiedLink ? (
                <Check className="w-6 h-6 text-green-500" />
              ) : (
                <Share2 className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
              )}
              {copiedLink && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </button>
            <button
              onClick={(e) => toggleFavorite(e, displayedUni.europe_rank)}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors shrink-0"
              aria-label={favorites.includes(displayedUni.europe_rank) ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-6 h-6 ${favorites.includes(displayedUni.europe_rank) ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Location</h3>
            <p className="text-slate-700 font-medium">{displayedUni.country}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">World Rank</h3>
              <p className="text-xl font-bold text-slate-800">#{displayedUni.world_rank}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Europe Rank</h3>
              <p className="text-xl font-bold text-blue-700">#{displayedUni.europe_rank}</p>
            </div>
          </div>

          {displayedUni.website && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Website</h3>
              <a
                href={displayedUni.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <Globe className="w-4 h-4" aria-hidden="true" />
                {displayedUni.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          {displayedUni.specializations && displayedUni.specializations.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Top Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {displayedUni.specializations.map((spec: string, idx: number) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(displayedUni.nearest_airport || displayedUni.nearest_train_station) && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Transport</h3>
              <div className="space-y-3">
                {displayedUni.nearest_airport && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-lg shrink-0">
                      <Plane className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{displayedUni.nearest_airport.name}</p>
                      <p className="text-xs text-slate-500">
                        Nearest Airport {displayedUni.nearest_airport.distance_km !== undefined ? `(${displayedUni.nearest_airport.distance_km} km)` : ''}
                      </p>
                    </div>
                  </div>
                )}
                {displayedUni.nearest_train_station && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                      <Train className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{displayedUni.nearest_train_station.name}</p>
                      <p className="text-xs text-slate-500">
                        Nearest Train Station {displayedUni.nearest_train_station.distance_km !== undefined ? `(${displayedUni.nearest_train_station.distance_km} km)` : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <TravelEstimator
                university={displayedUni}
                showWidget={showFlightWidget}
                onToggleWidget={() => setShowFlightWidget(!showFlightWidget)}
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
