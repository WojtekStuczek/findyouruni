import React, { useEffect, useRef, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { universities } from './data';
import { ChevronLeft, List, HelpCircle, X } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import { Header } from './components/Header';
import { UniversityList } from './components/UniversityList';
import { DetailsPanel } from './components/DetailsPanel';
import { getNumericRank } from './utils/rank';

const AboutPage = lazy(() => import('./components/AboutPage').then(m => ({ default: m.AboutPage })));

const allCountries = Array.from(new Set(universities.map(u => u.country))).sort();
const allSpecializations = Array.from(new Set(universities.flatMap(u => u.specializations || []))).sort();

export default function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<any>(null);
  const transportMarkersRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<number | string, L.Marker>>(new Map());

  const [mapInitialized, setMapInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'about'>('home');
  const [rankingMode, setRankingMode] = useState<'europe' | 'world'>('europe');
  const [selectedUni, setSelectedUni] = useState<typeof universities[0] | null>(null);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [showHelpPrompt, setShowHelpPrompt] = useState(false);

  const [favorites, setFavorites] = useState<(number | string)[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((e: React.MouseEvent, rank: number | string) => {
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(rank) ? prev.filter(r => r !== rank) : [...prev, rank]
    );
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setShowSidebar(true);
    }
  }, []);

  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem('hasSeenHelpPrompt');
    if (!hasSeenPrompt) {
      const timer = setTimeout(() => {
        if (currentPage === 'home') {
          setShowHelpPrompt(true);
        }
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [currentPage]);

  const handleDismissHelp = () => {
    setShowHelpPrompt(false);
    localStorage.setItem('hasSeenHelpPrompt', 'true');
  };

  const handleGoToAbout = () => {
    setShowHelpPrompt(false);
    localStorage.setItem('hasSeenHelpPrompt', 'true');
    setCurrentPage('about');
  };

  const handleFilterApply = useCallback((country: string, specialization: string) => {
    setSelectedCountry(country);
    setSelectedSpecialization(specialization);
  }, []);

  const filteredUniversities = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let list = universities;

    if (query) {
      list = list.filter(
        (uni) =>
          uni.name.toLowerCase().includes(query) ||
          uni.country.toLowerCase().includes(query)
      );
    }

    if (selectedCountry) {
      list = list.filter(uni => uni.country === selectedCountry);
    }

    if (selectedSpecialization) {
      list = list.filter(uni => uni.specializations?.includes(selectedSpecialization));
    }

    if (showFavoritesOnly) {
      list = list.filter(uni => favorites.includes(uni.europe_rank));
    }

    return list.sort((a, b) => {
      if (rankingMode === 'europe') return getNumericRank(a.europe_rank) - getNumericRank(b.europe_rank);
      return getNumericRank(a.world_rank) - getNumericRank(b.world_rank);
    });
  }, [searchQuery, rankingMode, selectedCountry, selectedSpecialization, showFavoritesOnly, favorites]);

  // Leaflet map init
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const el = mapRef.current;

    const initMap = () => {
      if (!el || leafletMap.current) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const bounds = L.latLngBounds([34, -25], [72, 45]);

      leafletMap.current = L.map(el, {
        center: [46.8182, 8.2275],
        zoom: window.innerWidth < 768 ? 3 : 5,
        minZoom: 2,
        maxZoom: 12,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        worldCopyJump: false,
        zoomControl: false,
      });

      const retinaFlag = L.Browser.retina;
      const tileSize = retinaFlag ? 512 : 256;
      const zoomOffset = retinaFlag ? -1 : 0;
      const tileSuffix = retinaFlag ? '@2x.png' : '.png';

      L.tileLayer(`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}${tileSuffix}`, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        tileSize,
        zoomOffset,
      }).addTo(leafletMap.current);

      // @ts-ignore
      clusterGroupRef.current = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        chunkedLoading: true,
        maxClusterRadius: 40,
        iconCreateFunction: function (cluster: any) {
          const childCount = cluster.getChildCount();
          let c = ' marker-cluster-';
          if (childCount < 10) {
            c += 'small';
          } else if (childCount < 100) {
            c += 'medium';
          } else {
            c += 'large';
          }
          return L.divIcon({
            html: `<div><span>${childCount}</span></div>`,
            className: 'marker-cluster' + c,
            iconSize: L.point(40, 40)
          });
        }
      }).addTo(leafletMap.current);

      transportMarkersRef.current = L.layerGroup().addTo(leafletMap.current);

      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);

      setMapInitialized(true);
    };

    let outerRaf = 0;
    let innerRaf = 0;
    outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        initMap();
      });
    });

    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  const focusUniversity = useCallback((uni: typeof universities[0]) => {
    setSelectedUni(uni);
    if (!leafletMap.current || !clusterGroupRef.current) return;

    const marker = markersRef.current.get(uni.europe_rank);
    if (marker) {
      // @ts-ignore
      clusterGroupRef.current.zoomToShowLayer(marker);
    }

    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  }, []);

  // Transport markers for selected university
  useEffect(() => {
    if (!leafletMap.current || !transportMarkersRef.current) return;

    transportMarkersRef.current.clearLayers();

    if (selectedUni) {
      const bounds = L.latLngBounds([selectedUni.lat, selectedUni.lng], [selectedUni.lat, selectedUni.lng]);

      if (selectedUni.nearest_airport) {
        const airportIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg bg-fuchsia-600 border-2 border-white z-[1000]">
              <svg class="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l7 4-3 3-3.5-1.5L2 15l5 2 2 5 1.5-1.5-1.5-3.5 3-3 4 7c.4-.2.7-.6.6-1.1z"/></svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });
        const marker = L.marker([selectedUni.nearest_airport.lat, selectedUni.nearest_airport.lng], { icon: airportIcon, title: `Nearest airport: ${selectedUni.nearest_airport.name}`, alt: `Nearest airport: ${selectedUni.nearest_airport.name}` })
          .bindPopup(`<b>${selectedUni.nearest_airport.name}</b><br/>Nearest Airport ${selectedUni.nearest_airport.distance_km !== undefined ? `(${selectedUni.nearest_airport.distance_km} km)` : ''}<br/><button onclick="window.openFlightsModal()" style="display: inline-block; margin-top: 5px; color: #7c3aed; background: none; border: none; padding: 0; font-weight: bold; font-size: 12px; cursor: pointer;">✨ Estimate Travel Cost</button>`);
        transportMarkersRef.current.addLayer(marker);
        bounds.extend([selectedUni.nearest_airport.lat, selectedUni.nearest_airport.lng]);
      }

      if (selectedUni.nearest_train_station) {
        const trainIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg bg-orange-500 border-2 border-white z-[1000]">
              <svg class="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h0"/><path d="M16 15h0"/></svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });
        const marker = L.marker([selectedUni.nearest_train_station.lat, selectedUni.nearest_train_station.lng], { icon: trainIcon, title: `Nearest train station: ${selectedUni.nearest_train_station.name}`, alt: `Nearest train station: ${selectedUni.nearest_train_station.name}` })
          .bindPopup(`<b>${selectedUni.nearest_train_station.name}</b><br/>Nearest Train Station ${selectedUni.nearest_train_station.distance_km !== undefined ? `(${selectedUni.nearest_train_station.distance_km} km)` : ''}`);
        transportMarkersRef.current.addLayer(marker);
        bounds.extend([selectedUni.nearest_train_station.lat, selectedUni.nearest_train_station.lng]);
      }

      if (selectedUni.nearest_airport || selectedUni.nearest_train_station) {
        setTimeout(() => {
          if (leafletMap.current) {
            leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
          }
        }, 300);
      }
    }
  }, [selectedUni]);

  // Update map markers when filtered list changes
  useEffect(() => {
    if (!leafletMap.current || !clusterGroupRef.current) return;

    clusterGroupRef.current.clearLayers();
    markersRef.current.clear();

    filteredUniversities.forEach((uni) => {
      const isTop10 = rankingMode === 'europe' ? getNumericRank(uni.europe_rank) <= 10 : getNumericRank(uni.world_rank) <= 50;

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="university-marker flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-all duration-300 ${
            isTop10
              ? 'bg-amber-500 scale-110 z-50'
              : 'bg-blue-600'
          }">
            <svg class="w-[18px] h-[18px] text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.42 10.922a2 2 0 0 0-.019-3.838L12.83 4.33a2 2 0 0 0-1.66 0L2.6 7.08a2 2 0 0 0 0 3.832l8.57 2.751a2 2 0 0 0 1.66 0z"/>
              <path d="M22 10v6"/>
              <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const marker = L.marker([uni.lat, uni.lng], { icon, title: uni.name, alt: uni.name });

      marker.on('click', () => {
        setSelectedUni(uni);
      });

      clusterGroupRef.current.addLayer(marker);
      markersRef.current.set(uni.europe_rank, marker);
    });

    if (filteredUniversities.length === 1 && leafletMap.current) {
      const uni = filteredUniversities[0];
      const marker = markersRef.current.get(uni.europe_rank);
      if (marker) {
        // @ts-ignore
        clusterGroupRef.current.zoomToShowLayer(marker);
      }
    }
  }, [filteredUniversities, rankingMode, mapInitialized]);

  return (
    <>
      {currentPage === 'about' && (
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>}>
          <AboutPage onBack={() => setCurrentPage('home')} />
        </Suspense>
      )}
      <div className={`relative h-[100dvh] w-screen flex flex-col ${currentPage === 'about' ? 'hidden' : ''}`} style={{ backgroundColor: 'var(--surface)' }}>
      <a href="#map" className="skip-link">Skip to map</a>

      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCountry={selectedCountry}
        selectedSpecialization={selectedSpecialization}
        allCountries={allCountries}
        allSpecializations={allSpecializations}
        onFilterApply={handleFilterApply}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
        showHelpPrompt={showHelpPrompt}
        onGoToAbout={handleGoToAbout}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <UniversityList
          universities={filteredUniversities}
          rankingMode={rankingMode}
          favorites={favorites}
          showSidebar={showSidebar}
          focusUniversity={focusUniversity}
          toggleFavorite={toggleFavorite}
        />

        {/* Map Container */}
        <main className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0 z-0 map-skeleton" id="map" role="application" aria-label="Interactive map of European universities" />

          {/* Legend */}
          <div className="hidden md:block absolute bottom-8 right-20 z-[1000] p-4 rounded-2xl shadow-lg border max-w-xs transition-all backdrop-blur-md bg-white/95 border-slate-200/60 text-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Legend</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-amber-200 flex items-center justify-center text-[8px] font-bold text-white shadow-md">1</div>
                <span className="text-xs font-medium text-slate-600">
                  {rankingMode === 'europe' ? 'Top 10 Europe' : 'Top 50 World'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-bold shadow-md bg-white border-blue-500 text-blue-600">11</div>
                <span className="text-xs font-medium text-slate-600">Other Institutions</span>
              </div>
            </div>
          </div>

          {/* Floating Toggle Button */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            aria-label={showSidebar ? 'Hide university list' : 'Show university list'}
            className={`absolute z-[1005] bg-white border border-slate-200 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)] flex items-center justify-center hover:bg-slate-50 hover:scale-105 transition-all duration-300 group w-12 h-12 ${
              selectedUni ? 'hidden md:flex' : 'flex'
            } ${
              showSidebar
                ? 'top-1/2 -translate-y-1/2 left-[calc(100%-4rem)] md:left-80 lg:left-96 md:-translate-x-1/2'
                : 'top-1/2 -translate-y-1/2 left-4 translate-x-0'
            }`}
          >
            <div className="relative w-6 h-6">
              <ChevronLeft className={`absolute inset-0 w-6 h-6 text-slate-500 group-hover:text-blue-600 transition-all duration-300 ${showSidebar ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-180'}`} />
              <List className={`absolute inset-0 w-6 h-6 text-slate-500 group-hover:text-blue-600 transition-all duration-300 ${!showSidebar ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180'}`} />
            </div>
          </button>
        </main>

        <DetailsPanel
          selectedUni={selectedUni}
          favorites={favorites}
          onClose={() => setSelectedUni(null)}
          toggleFavorite={toggleFavorite}
        />
      </div>

      {/* Help Prompt */}
      {showHelpPrompt && currentPage === 'home' && (
        <div className="fixed top-20 right-4 md:right-6 z-[2000] w-[90vw] max-w-sm bg-blue-600 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] border border-blue-500 p-5 animate-in fade-in slide-in-from-top-4 duration-500" role="dialog" aria-label="Help prompt">
          <div className="absolute -top-2 right-[54px] md:right-[325px] w-4 h-4 bg-blue-600 rotate-45 border-t border-l border-blue-500"></div>

          <div className="flex items-start gap-4 relative z-10">
            <div className="bg-white/20 p-2.5 rounded-xl text-white shrink-0">
              <HelpCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-white mb-1 text-lg">Need some help?</h3>
                <button
                  onClick={handleDismissHelp}
                  className="text-blue-200 hover:text-white -mt-1 -mr-1 p-1 transition-colors"
                  aria-label="Dismiss help prompt"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-blue-100 leading-relaxed">
                Not sure where to start? Check out our guide on how to use the platform!
              </p>
            </div>
          </div>
        </div>
      )}

      <Analytics />
      <SpeedInsights />
    </div>
    </>
  );
}
