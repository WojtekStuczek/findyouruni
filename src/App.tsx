import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { universities } from './data';
import { Trophy, Info, Search, X, List, Map as MapIcon, ChevronRight, ChevronLeft, Globe, LayoutGrid, ListFilter as Filter, GraduationCap, HelpCircle, Heart, Plane, Train, Bus, Car, Navigation, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { ContactModal } from './components/ContactModal';
import { AboutPage } from './components/AboutPage';
import { cloudinaryUrls } from './cloudinaryUrls';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Markdown from 'react-markdown';

interface TravelSegment {
  mode: string;
  time: string;
  cost: number;
}

interface TravelRoute {
  stops: string[];
  segments: TravelSegment[];
  totalTime: string;
  totalCost: number;
}

const allCountries = Array.from(new Set(universities.map(u => u.country))).sort();
const allSpecializations = Array.from(new Set(universities.flatMap(u => u.specializations || []))).sort();

const UniversityImage = ({ uni, rank, isHighRank, rankTextClass, className }: any) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [uni.europe_rank]);

  if (error) {
    return (
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-sm transition-transform group-hover:scale-110 ${rankTextClass} ${
        isHighRank ? 'bg-amber-500 text-white' : 'bg-blue-50 text-blue-600'
      } ${className}`}>
        {rank}
      </div>
    );
  }

  const photoUrl = cloudinaryUrls[uni.europe_rank as keyof typeof cloudinaryUrls]?.thumb;

  return (
    <div className={`w-10 h-10 rounded-xl shrink-0 overflow-hidden shadow-sm ${className}`}>
      {!loaded && <div className="w-full h-full bg-slate-200 animate-pulse" />}
      <img
        src={photoUrl}
        alt={uni.name}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
      />
    </div>
  );
};

const DetailsImage = ({ uni }: { uni: any }) => {
  const [error, setError] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);

  useEffect(() => {
    setError(false);
    setFullLoaded(false);
  }, [uni.europe_rank]);

  if (error) {
    return (
      <div className="w-full h-48 rounded-xl shadow-md mb-6 bg-blue-50 flex items-center justify-center border border-blue-100">
        <GraduationCap className="w-16 h-16 text-blue-200" />
      </div>
    );
  }

  const thumbUrl = cloudinaryUrls[uni.europe_rank as keyof typeof cloudinaryUrls]?.thumb;
  const fullUrl = cloudinaryUrls[uni.europe_rank as keyof typeof cloudinaryUrls]?.full;

  return (
    <div className="w-full h-48 rounded-xl shadow-md mb-6 overflow-hidden relative">
      {/* Rozmyte zdjęcie niskiej jakości - widoczne od razu */}
      <img
        src={thumbUrl}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover scale-110 blur-sm transition-opacity duration-500 ${fullLoaded ? 'opacity-0' : 'opacity-100'}`}
      />
      {/* Pełne zdjęcie - pojawia się po załadowaniu */}
      <img
        key={uni.europe_rank}
        src={fullUrl}
        alt={uni.name}
        onLoad={() => setFullLoaded(true)}
        onError={() => setError(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${fullLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

export function getCountryCode(countryName: string): string {
  const mapping: Record<string, string> = {
    "United Kingdom": "gb",
    "Switzerland": "ch",
    "Germany": "de",
    "France": "fr",
    "Netherlands": "nl",
    "Belgium": "be",
    "Sweden": "se",
    "Ireland": "ie",
    "Italy": "it",
    "Denmark": "dk",
    "Russian Federation": "ru",
    "Finland": "fi",
    "Norway": "no",
    "Austria": "at",
    "Spain": "es",
    "Portugal": "pt",
    "Czechia": "cz",
    "Poland": "pl",
    "Greece": "gr",
    "Estonia": "ee",
    "Luxembourg": "lu",
    "Lithuania": "lt",
    "Belarus": "by",
    "Slovenia": "si",
    "Hungary": "hu",
    "Iceland": "is",
    "Latvia": "lv",
    "Serbia": "rs",
    "Romania": "ro",
    "Ukraine": "ua",
    "Bulgaria": "bg",
    "Malta": "mt",
    "Croatia": "hr",
    "Bosnia and Herzegovina": "ba",
    "Slovakia": "sk",
    "Cyprus": "cy",
    "Montenegro": "me",
    "North Macedonia": "mk",
    "Albania": "al",
    "Moldova": "md",
    "Andorra": "ad",
    "San Marino": "sm",
    "Liechtenstein": "li",
    "Monaco": "mc",
    "Vatican City": "va"
  };
  return mapping[countryName] || "eu";
}

export default function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<any>(null);
  const transportMarkersRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<number | string, L.Marker>>(new Map());
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [showFlightWidget, setShowFlightWidget] = useState(false);
  const [flightOrigin, setFlightOrigin] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [travelEstimate, setTravelEstimate] = useState<TravelRoute | null>(null);
  const [travelEstimateError, setTravelEstimateError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const getTransportIcon = (mode: string) => {
    const lowerMode = mode.toLowerCase();
    if (lowerMode.includes('flight') || lowerMode.includes('plane') || lowerMode.includes('air')) return <Plane className="w-3 h-3" />;
    if (lowerMode.includes('train') || lowerMode.includes('rail')) return <Train className="w-3 h-3" />;
    if (lowerMode.includes('bus') || lowerMode.includes('coach')) return <Bus className="w-3 h-3" />;
    if (lowerMode.includes('car') || lowerMode.includes('drive') || lowerMode.includes('taxi')) return <Car className="w-3 h-3" />;
    return <Navigation className="w-3 h-3" />;
  };

  useEffect(() => {
    setFlightOrigin(localStorage.getItem('homeLocation') || '');
  }, []);

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

  useEffect(() => {
    (window as any).openFlightsModal = () => {
      setShowFlightWidget(true);
      if (window.innerWidth < 768) {
        setShowSidebar(true);
      }
    };
    return () => {
      delete (window as any).openFlightsModal;
    };
  }, []);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'about'>('home');
  const [rankingMode, setRankingMode] = useState<'europe' | 'world'>('europe');
  const [selectedUni, setSelectedUni] = useState<typeof universities[0] | null>(null);
  const [displayedUni, setDisplayedUni] = useState<typeof universities[0] | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    if (selectedUni) {
      setDisplayedUni(selectedUni);
      setTimeout(() => {
        const container = document.getElementById('details-scroll-container');
        if (container) {
          container.scrollTop = 0;
        }
      }, 10);
    }
  }, [selectedUni]);
  
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [tempCountry, setTempCountry] = useState<string>('');
  const [tempSpecialization, setTempSpecialization] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [preselectedUni, setPreselectedUni] = useState<string>('');
  const [showHelpPrompt, setShowHelpPrompt] = useState(false);
  
  const [favorites, setFavorites] = useState<(number | string)[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent, rank: number | string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(rank) ? prev.filter(r => r !== rank) : [...prev, rank]
    );
  };

  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem('hasSeenHelpPrompt');
    if (!hasSeenPrompt) {
      const timer = setTimeout(() => {
        if (currentPage === 'home') {
          setShowHelpPrompt(true);
        }
      }, 30000); // 30 seconds
      return () => clearTimeout(timer);
    }
  }, [currentPage]);

  const handleDismissHelp = () => {
    setShowHelpPrompt(false);
    localStorage.setItem('hasSeenHelpPrompt', 'true');
  };

  const handleEstimateTravel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightOrigin.trim() || !displayedUni) return;
    localStorage.setItem('homeLocation', flightOrigin.trim());
    
    setIsEstimating(true);
    setTravelEstimate(null);
    setTravelEstimateError(null);

    try {
      const response = await fetch('/api/transport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: flightOrigin.trim(),
          destinationName: displayedUni.name,
          destinationCountry: displayedUni.country,
          nearestAirport: displayedUni.nearest_airport?.name || 'unknown',
          nearestTrainStation: displayedUni.nearest_train_station?.name || 'unknown'
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setTravelEstimate(data);
    } catch (error) {
      console.error("Error estimating travel:", error);
      setTravelEstimateError("Sorry, I couldn't estimate the travel cost right now. Please try again later.");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleGoToAbout = () => {
    setShowHelpPrompt(false);
    localStorage.setItem('hasSeenHelpPrompt', 'true');
    setCurrentPage('about');
  };

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setShowSidebar(true);
    }
  }, []);

  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

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
      const getNumericRank = (rank: number | string) => {
        if (typeof rank === 'number') return rank;
        const match = rank.match(/\d+/);
        return match ? parseInt(match[0], 10) : 9999;
      };
      if (rankingMode === 'europe') return getNumericRank(a.europe_rank) - getNumericRank(b.europe_rank);
      return getNumericRank(a.world_rank) - getNumericRank(b.world_rank);
    });
  }, [searchQuery, rankingMode, selectedCountry, selectedSpecialization, showFavoritesOnly, favorites]);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const bounds = L.latLngBounds([34, -25], [72, 45]);
    
    leafletMap.current = L.map(mapRef.current, {
      center: [46.8182, 8.2275],
      zoom: window.innerWidth < 768 ? 3 : 5,
      minZoom: 2,
      maxZoom: 12,
      maxBounds: bounds,
      maxBoundsViscosity: 1.0,
      worldCopyJump: false,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(leafletMap.current);

    // @ts-ignore
    clusterGroupRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      chunkedLoading: true,
      maxClusterRadius: 40,
      iconCreateFunction: function (cluster) {
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

    return () => {
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

  useEffect(() => {
    if (!leafletMap.current || !transportMarkersRef.current) return;

    transportMarkersRef.current.clearLayers();

    if (selectedUni) {
      const bounds = L.latLngBounds([selectedUni.lat, selectedUni.lng], [selectedUni.lat, selectedUni.lng]);

      if (selectedUni.nearest_airport) {
        const airportIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg bg-sky-500 border-2 border-white z-[1000]">
              <svg class="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l7 4-3 3-3.5-1.5L2 15l5 2 2 5 1.5-1.5-1.5-3.5 3-3 4 7c.4-.2.7-.6.6-1.1z"/></svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });
        const marker = L.marker([selectedUni.nearest_airport.lat, selectedUni.nearest_airport.lng], { icon: airportIcon })
          .bindPopup(`<b>${selectedUni.nearest_airport.name}</b><br/>Nearest Airport ${selectedUni.nearest_airport.distance_km !== undefined ? `(${selectedUni.nearest_airport.distance_km} km)` : ''}<br/><button onclick="window.openFlightsModal()" style="display: inline-block; margin-top: 5px; color: #9333ea; background: none; border: none; padding: 0; font-weight: bold; font-size: 12px; cursor: pointer;">✨ Estimate Travel Cost</button>`);
        transportMarkersRef.current.addLayer(marker);
        bounds.extend([selectedUni.nearest_airport.lat, selectedUni.nearest_airport.lng]);
      }

      if (selectedUni.nearest_train_station) {
        const trainIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg bg-emerald-500 border-2 border-white z-[1000]">
              <svg class="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h0"/><path d="M16 15h0"/></svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });
        const marker = L.marker([selectedUni.nearest_train_station.lat, selectedUni.nearest_train_station.lng], { icon: trainIcon })
          .bindPopup(`<b>${selectedUni.nearest_train_station.name}</b><br/>Nearest Train Station ${selectedUni.nearest_train_station.distance_km !== undefined ? `(${selectedUni.nearest_train_station.distance_km} km)` : ''}`);
        transportMarkersRef.current.addLayer(marker);
        bounds.extend([selectedUni.nearest_train_station.lat, selectedUni.nearest_train_station.lng]);
      }

      if (selectedUni.nearest_airport || selectedUni.nearest_train_station) {
        // Use a small timeout to allow zoomToShowLayer to finish its animation
        setTimeout(() => {
          if (leafletMap.current) {
            leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
          }
        }, 300);
      }
    }
  }, [selectedUni]);

  useEffect(() => {
    if (!leafletMap.current || !clusterGroupRef.current) return;

    clusterGroupRef.current.clearLayers();
    markersRef.current.clear();

    filteredUniversities.forEach((uni) => {
      const getNumericRank = (rank: number | string) => {
        if (typeof rank === 'number') return rank;
        const match = rank.match(/\d+/);
        return match ? parseInt(match[0], 10) : 9999;
      };
      const isTop10 = rankingMode === 'europe' ? getNumericRank(uni.europe_rank) <= 10 : getNumericRank(uni.world_rank) <= 50;
      const rankToShow = rankingMode === 'europe' ? uni.europe_rank : uni.world_rank;
      
      const isTwoPartWorldRank = rankingMode === 'world' && typeof uni.world_rank === 'string' && uni.world_rank.includes('-');
      const rankTextClass = isTwoPartWorldRank ? 'text-[8px] tracking-tighter leading-none text-center px-0.5' : 'text-[9px]';
      
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

      const marker = L.marker([uni.lat, uni.lng], { icon });

      marker.on('click', () => {
        setSelectedUni(uni);
        setShowFlightWidget(false);
        setTravelEstimate(null);
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
  }, [filteredUniversities, rankingMode]);

  return (
    <>
      {currentPage === 'about' && <AboutPage onBack={() => setCurrentPage('home')} />}
      <div className={`relative h-[100vh] w-screen flex flex-col bg-slate-50 ${currentPage === 'about' ? 'hidden' : ''}`}>
      {/* Header */}
      <header className="z-[1001] border-b px-4 md:px-6 py-3 md:py-4 shadow-sm flex flex-row items-center justify-between gap-2 md:gap-4 bg-white/90 border-slate-200 text-slate-900 backdrop-blur-md">
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
          {/* Ranking Mode Toggle - temporarily disabled
          <div className={`items-center gap-2 ${isMobileSearchOpen ? 'hidden md:flex' : 'flex'}`}>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:block">Ranking type:</span>
            <div className="flex p-1 rounded-xl border transition-all bg-slate-100 border-slate-200">
              <button
              onClick={() => setRankingMode('europe')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                rankingMode === 'europe' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Europe
            </button>
            <button
              onClick={() => setRankingMode('world')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                rankingMode === 'world' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              World
            </button>
          </div>
          </div>
          */}

          <div className={`flex items-center gap-2 ${isMobileSearchOpen ? 'w-full' : ''}`}>
            {!isMobileSearchOpen && (
              <button
                onClick={() => setCurrentPage('about')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm relative"
                title="About"
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
                    onClick={() => setCurrentPage('about')}
                    className="p-2 rounded-xl transition-all bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center w-[36px] h-[36px] shadow-sm relative"
                  >
                    <Info className="w-4 h-4" />
                    {showHelpPrompt && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#ff0000] border-2 border-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.8)]"></span>
                    )}
                  </button>
                  <button 
                    onClick={() => setIsMobileSearchOpen(true)}
                    className="p-2 rounded-xl border transition-all bg-slate-100 border-slate-200 text-slate-600 flex items-center justify-center w-[36px] h-[36px]"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className={`${isMobileSearchOpen ? 'block' : 'hidden md:block'} relative w-full`}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search university or country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 rounded-xl text-sm border transition-all outline-none focus:ring-2 focus:ring-blue-500 bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
                {searchQuery ? (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                ) : isMobileSearchOpen ? (
                  <button 
                    onClick={() => setIsMobileSearchOpen(false)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 md:hidden"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className={`relative ${isMobileSearchOpen ? 'hidden' : 'block'}`}>
              <button 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`p-2 rounded-xl border transition-all flex items-center justify-center w-[36px] h-[36px] ${
                  showFavoritesOnly 
                    ? 'bg-red-50 border-red-200 text-red-500' 
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
                title="Show Favorites"
              >
                <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className={`relative ${isMobileSearchOpen ? 'hidden' : 'block'}`}>
              <button 
                onClick={() => {
                  setTempCountry(selectedCountry);
                  setTempSpecialization(selectedSpecialization);
                  setIsFilterOpen(!isFilterOpen);
                }}
                className={`p-2 rounded-xl border transition-all flex items-center justify-center w-[36px] h-[36px] ${
                  selectedCountry || selectedSpecialization 
                    ? 'bg-blue-50 border-blue-200 text-blue-600' 
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <Filter className="w-4 h-4" />
                {(selectedCountry || selectedSpecialization) && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              
              {isFilterOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[1999]" 
                    onClick={() => setIsFilterOpen(false)}
                  ></div>
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-[2000]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-sm text-slate-800">Filters</h3>
                      {(tempCountry || tempSpecialization || selectedCountry || selectedSpecialization) && (
                        <button 
                          onClick={() => { 
                            setTempCountry(''); 
                            setTempSpecialization(''); 
                            setSelectedCountry(''); 
                            setSelectedSpecialization(''); 
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Country</label>
                        <select 
                          value={tempCountry} 
                          onChange={(e) => setTempCountry(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                        >
                          <option value="">All Countries</option>
                          {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Specialization</label>
                        <select 
                          value={tempSpecialization} 
                          onChange={(e) => setTempSpecialization(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                        >
                          <option value="">All Specializations</option>
                          {allSpecializations.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCountry(tempCountry);
                          setSelectedSpecialization(tempSpecialization);
                          setIsFilterOpen(false);
                        }}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar List */}
        <aside className={`z-[1000] absolute inset-y-0 left-0 w-full md:w-80 lg:w-96 transition-transform duration-300 transform bg-white border-r border-slate-200 flex flex-col shadow-2xl ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-28">
            {filteredUniversities.map((uni) => {
              const getNumericRank = (rank: number | string) => {
                if (typeof rank === 'number') return rank;
                const match = rank.match(/\d+/);
                return match ? parseInt(match[0], 10) : 9999;
              };
              const rank = rankingMode === 'europe' ? uni.europe_rank : uni.world_rank;
              const isHighRank = rankingMode === 'europe' ? getNumericRank(uni.europe_rank) <= 10 : getNumericRank(uni.world_rank) <= 50;
              
              const isTwoPartWorldRank = rankingMode === 'world' && typeof uni.world_rank === 'string' && uni.world_rank.includes('-');
              const rankTextClass = isTwoPartWorldRank ? 'text-[10px] tracking-tighter leading-none text-center px-0.5' : 'text-xs';
              
              return (
                <div
                  key={uni.europe_rank}
                  onClick={() => focusUniversity(uni)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      focusUniversity(uni);
                    }
                  }}
                  className="w-full text-left p-4 border-b transition-all group flex items-center gap-4 border-slate-50 hover:bg-blue-50/50 cursor-pointer"
                >
                  <UniversityImage 
                    uni={uni} 
                    rank={rank} 
                    isHighRank={isHighRank} 
                    rankTextClass={rankTextClass} 
                    className=""
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate text-slate-900">
                      {uni.name}
                    </h3>
                    <p className="text-xs flex items-center gap-1.5 mt-0.5 text-slate-500">
                      <img src={`https://flagcdn.com/w40/${getCountryCode(uni.country)}.png`} alt={uni.country} className="w-4 h-auto rounded-[2px] shadow-sm" />
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
                  >
                    <Heart className={`w-4 h-4 ${favorites.includes(uni.europe_rank) ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 text-slate-300" />
                </div>
              );
            })}
            {filteredUniversities.length === 0 && (
              <div className="p-12 text-center">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No results found for your search.</p>
              </div>
            )}
          </div>
          <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-slate-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 hidden">
            <button
              onClick={() => { setPreselectedUni(''); setIsContactModalOpen(true); }}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold text-sm transition-colors shadow-md shadow-blue-200"
            >
              <GraduationCap className="w-5 h-5" />
              Need Help Applying?
            </button>
          </div>
        </aside>

        {/* Map Container */}
        <main className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0 z-0" id="map" />
          
          {/* Legend */}
          <div className="hidden md:block absolute bottom-8 right-20 z-[1000] p-4 rounded-2xl shadow-xl border max-w-xs transition-all backdrop-blur-md bg-white/90 border-slate-200 text-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-tight">Map Legend</h2>
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

          {/* Floating Toggle Button (Desktop & Mobile) */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`absolute z-[1005] bg-white border border-slate-200 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)] flex items-center justify-center hover:bg-slate-50 hover:scale-105 transition-all duration-300 group font-bold text-sm text-slate-700 px-4 py-2.5 gap-2 ${
              selectedUni ? 'hidden md:flex' : 'flex'
            } ${
              showSidebar 
                ? 'bottom-6 left-1/2 -translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-80 lg:left-96 md:-translate-x-1/2' 
                : 'bottom-6 left-1/2 -translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-4 md:translate-x-0'
            }`}
          >
            {showSidebar ? (
              <>
                <ChevronLeft className="w-4 h-4 text-blue-600" />
                <span>Hide</span>
              </>
            ) : (
              <>
                <List className="w-4 h-4 text-blue-600" />
                <span>List</span>
              </>
            )}
          </button>
        </main>

        {/* Right Sidebar - Details */}
        <aside className={`z-[1000] absolute inset-y-0 right-0 w-full md:w-80 lg:w-96 transition-transform duration-300 transform bg-white border-l border-slate-200 flex flex-col shadow-2xl ${
          selectedUni ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {displayedUni && (
            <>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h2 className="font-bold text-sm uppercase tracking-wider text-slate-500">
                  University Details
                </h2>
                <button onClick={() => setSelectedUni(null)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div id="details-scroll-container" className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-28">
                <DetailsImage uni={displayedUni} />
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <img src={`https://flagcdn.com/w40/${getCountryCode(displayedUni.country)}.png`} alt={displayedUni.country} className="w-10 h-auto rounded-sm shadow-md" />
                    <h2 className="text-2xl font-bold leading-tight text-slate-900">{displayedUni.name}</h2>
                  </div>
                  <button 
                    onClick={(e) => toggleFavorite(e, displayedUni.europe_rank)}
                    className="p-2 rounded-full hover:bg-slate-100 transition-colors shrink-0"
                  >
                    <Heart className={`w-6 h-6 ${favorites.includes(displayedUni.europe_rank) ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                  </button>
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
                        <Globe className="w-4 h-4" />
                        {displayedUni.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}

                  {displayedUni.specializations && displayedUni.specializations.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Top Specializations</h3>
                      <div className="flex flex-wrap gap-2">
                        {displayedUni.specializations.map((spec, idx) => (
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
                              <Plane className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {displayedUni.nearest_airport.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                Nearest Airport {displayedUni.nearest_airport.distance_km !== undefined ? `(${displayedUni.nearest_airport.distance_km} km)` : ''}
                              </p>
                            </div>
                          </div>
                        )}
                        {displayedUni.nearest_train_station && (
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                              <Train className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {displayedUni.nearest_train_station.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                Nearest Train Station {displayedUni.nearest_train_station.distance_km !== undefined ? `(${displayedUni.nearest_train_station.distance_km} km)` : ''}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 p-3 bg-purple-50/30 rounded-xl border border-purple-100">
                        <button 
                          onClick={() => {
                            setShowFlightWidget(!showFlightWidget);
                          }}
                          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-purple-700 hover:text-purple-800 transition-colors bg-purple-100/50 hover:bg-purple-100 px-3 py-2 rounded-lg"
                        >
                          <Sparkles className="w-4 h-4" />
                          Estimate Travel Cost
                        </button>
                        
                        {showFlightWidget && (
                          <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <form 
                              onSubmit={handleEstimateTravel} 
                              className="mb-3"
                            >
                              <label className="block text-[10px] font-bold text-purple-800 uppercase tracking-wider mb-1.5">Where are you traveling from?</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={flightOrigin}
                                  onChange={(e) => setFlightOrigin(e.target.value)}
                                  placeholder="e.g. Warsaw or WAW"
                                  className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                  required
                                />
                                <button 
                                  type="submit" 
                                  disabled={isEstimating}
                                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center min-w-[70px]"
                                >
                                  {isEstimating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Calculate'}
                                </button>
                              </div>
                            </form>
                            
                            {travelEstimateError && (
                              <div className="mt-3 text-xs text-red-500 font-medium">
                                {travelEstimateError}
                              </div>
                            )}
                            
                            {travelEstimate && (
                              <div className="mt-4 pt-4 border-t border-purple-200/50" ref={resultsRef}>
                                <h4 className="text-[10px] font-bold text-purple-800 mb-4 uppercase tracking-wider">Fastest Route</h4>
                                
                                <div className="relative flex flex-col w-full pl-2 pb-2">
                                  {travelEstimate.stops.map((stop, index) => (
                                    <React.Fragment key={index}>
                                      {/* Stop Node */}
                                      <div className="flex items-center relative z-10">
                                        <div className="w-3 h-3 rounded-full bg-purple-600 border-2 border-white shadow-sm shrink-0"></div>
                                        <span className="ml-3 text-[11px] font-bold text-slate-700" title={stop}>
                                          {stop}
                                        </span>
                                      </div>

                                      {/* Segment Line */}
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
                                              Cost: €{travelEstimate.segments[index].cost}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                                
                                {/* Totals */}
                                <div className="mt-6 flex justify-between items-center bg-white p-2.5 rounded-lg border border-purple-100 shadow-sm">
                                  <div>
                                    <span className="block text-[9px] text-purple-600 font-bold uppercase">Total Time</span>
                                    <span className="text-xs font-bold text-slate-800">{travelEstimate.totalTime}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="block text-[9px] text-purple-600 font-bold uppercase">Total Cost</span>
                                    <span className="text-xs font-bold text-green-600">€{travelEstimate.totalCost}</span>
                                  </div>
                                </div>
                                
                                <div className="mt-4 pt-3 border-t border-purple-200/50 flex justify-end">
                                  <a 
                                    href={`https://www.google.com/travel/flights?q=Flights%20from%20${encodeURIComponent(flightOrigin.trim())}%20to%20${encodeURIComponent(displayedUni.nearest_airport?.name || displayedUni.name)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Check actual prices on Google Flights
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] border-t border-slate-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 hidden">
                <button
                  onClick={() => { setPreselectedUni(displayedUni.name); setIsContactModalOpen(true); }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold text-sm transition-colors shadow-md shadow-blue-200"
                >
                  <GraduationCap className="w-5 h-5" />
                  Apply to {displayedUni.name}
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
      
      {/* Help Prompt */}
      {showHelpPrompt && currentPage === 'home' && (
        <div className="fixed top-20 right-4 md:right-6 z-[2000] w-[90vw] max-w-sm bg-blue-600 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] border border-blue-500 p-5 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Tooltip Arrow pointing up to the About button */}
          <div className="absolute -top-2 right-[54px] md:right-[325px] w-4 h-4 bg-blue-600 rotate-45 border-t border-l border-blue-500"></div>
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="bg-white/20 p-2.5 rounded-xl text-white shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-white mb-1 text-lg">Need some help?</h3>
                <button 
                  onClick={handleDismissHelp} 
                  className="text-blue-200 hover:text-white -mt-1 -mr-1 p-1 transition-colors"
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

      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)}
        initialUniversities={preselectedUni}
      />
      <Analytics />
      <SpeedInsights />
    </div>
    </>
  );
}