import React, { useState, useEffect, useRef } from 'react';
import { Plane, Train, Bus, Car, Navigation, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import type { University, TravelRoute } from '../types';

function getTransportIcon(mode: string) {
  const lowerMode = mode.toLowerCase();
  if (lowerMode.includes('flight') || lowerMode.includes('plane') || lowerMode.includes('air')) return <Plane className="w-3 h-3" />;
  if (lowerMode.includes('train') || lowerMode.includes('rail')) return <Train className="w-3 h-3" />;
  if (lowerMode.includes('bus') || lowerMode.includes('coach')) return <Bus className="w-3 h-3" />;
  if (lowerMode.includes('car') || lowerMode.includes('drive') || lowerMode.includes('taxi')) return <Car className="w-3 h-3" />;
  return <Navigation className="w-3 h-3" />;
}

interface TravelEstimatorProps {
  university: University;
  showWidget: boolean;
  onToggleWidget: () => void;
}

export function TravelEstimator({ university, showWidget, onToggleWidget }: TravelEstimatorProps) {
  const [flightOrigin, setFlightOrigin] = useState(() => localStorage.getItem('homeLocation') || '');
  const [isEstimating, setIsEstimating] = useState(false);
  const [travelEstimate, setTravelEstimate] = useState<TravelRoute | null>(null);
  const [travelEstimateError, setTravelEstimateError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTravelEstimate(null);
    setTravelEstimateError(null);
  }, [university.europe_rank]);

  useEffect(() => {
    if (travelEstimate && resultsRef.current) {
      setTimeout(() => {
        const container = document.getElementById('details-scroll-container');
        if (container && resultsRef.current) {
          const containerRect = container.getBoundingClientRect();
          const elementRect = resultsRef.current.getBoundingClientRect();
          const scrollTop = container.scrollTop + elementRect.top - containerRect.top - (containerRect.height / 2) + (elementRect.height / 2);
          container.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [travelEstimate]);

  const handleEstimateTravel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightOrigin.trim()) return;
    localStorage.setItem('homeLocation', flightOrigin.trim());

    setIsEstimating(true);
    setTravelEstimate(null);
    setTravelEstimateError(null);

    try {
      const response = await fetch('/api/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: flightOrigin.trim(),
          destinationName: university.name,
          destinationCountry: university.country,
          nearestAirport: university.nearest_airport?.name || 'unknown',
          nearestTrainStation: university.nearest_train_station?.name || 'unknown',
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setTravelEstimate(data);
    } catch (error) {
      console.error("Error estimating travel:", error);
      setTravelEstimateError("Sorry, I couldn't estimate the travel cost right now. Please try again later.");
    } finally {
      setIsEstimating(false);
    }
  };

  return (
    <div className="mt-4 p-3 bg-purple-50/30 rounded-xl border border-purple-100">
      <button
        onClick={onToggleWidget}
        className="w-full flex items-center justify-center gap-2 text-sm font-bold text-purple-700 hover:text-purple-800 transition-colors bg-purple-100/50 hover:bg-purple-100 px-3 py-2 rounded-lg"
        aria-label="Estimate travel cost"
      >
        <Sparkles className="w-4 h-4" aria-hidden="true" />
        Estimate Travel Cost
      </button>

      {showWidget && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleEstimateTravel} className="mb-3">
            <label className="block text-[10px] font-bold text-purple-800 uppercase tracking-wider mb-1.5">Where are you traveling from?</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={flightOrigin}
                onChange={(e) => setFlightOrigin(e.target.value)}
                placeholder="e.g. Warsaw or WAW"
                className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                required
                aria-label="Origin city or airport code"
              />
              <button
                type="submit"
                disabled={isEstimating}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center min-w-[70px]"
              >
                {isEstimating ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Calculating" /> : 'Calculate'}
              </button>
            </div>
          </form>

          {travelEstimateError && (
            <div className="mt-3 text-xs text-red-500 font-medium" role="alert">
              {travelEstimateError}
            </div>
          )}

          {travelEstimate && (
            <div className="mt-4 pt-4 border-t border-purple-200/50" ref={resultsRef}>
              <h4 className="text-[10px] font-bold text-purple-800 mb-4 uppercase tracking-wider">Fastest Route</h4>

              <div className="relative flex flex-col w-full pl-2 pb-2">
                {travelEstimate.stops.map((stop, index) => (
                  <React.Fragment key={index}>
                    <div className="flex items-center relative z-10">
                      <div className="w-3 h-3 rounded-full bg-purple-600 border-2 border-white shadow-sm shrink-0"></div>
                      <span className="ml-3 text-[11px] font-bold text-slate-700" title={stop}>
                        {stop}
                      </span>
                    </div>

                    {index < travelEstimate.stops.length - 1 && (
                      <div className="flex items-center relative min-h-[40px] ml-1.5 border-l-2 border-purple-200 pl-6 py-2">
                        <div className="absolute -left-[11px] bg-white p-1 rounded-full border border-purple-200 text-purple-600 shadow-sm">
                          {getTransportIcon(travelEstimate.segments[index].mode)}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                            <span className="font-bold text-slate-700">{travelEstimate.segments[index].mode}</span> • {travelEstimate.segments[index].time}
                          </span>
                          <span className="text-[10px] font-semibold text-green-600">
                            Cost: &euro;{travelEstimate.segments[index].cost}
                          </span>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="mt-6 flex justify-between items-center bg-white p-2.5 rounded-lg border border-purple-100 shadow-sm">
                <div>
                  <span className="block text-[9px] text-purple-600 font-bold uppercase">Total Time</span>
                  <span className="text-xs font-bold text-slate-800">{travelEstimate.totalTime}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] text-purple-600 font-bold uppercase">Total Cost</span>
                  <span className="text-xs font-bold text-green-600">&euro;{travelEstimate.totalCost}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-purple-200/50 flex justify-end">
                <a
                  href={`https://www.google.com/travel/flights?q=Flights%20from%20${encodeURIComponent(flightOrigin.trim())}%20to%20${encodeURIComponent(university.nearest_airport?.name || university.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  Check actual prices on Google Flights
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
