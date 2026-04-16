import type { University } from '../data';

export type { University, CloudinaryUrlMap } from '../data';

export interface TravelSegment {
  mode: string;
  time: string;
  cost: number;
}

export interface TravelRoute {
  stops: string[];
  segments: TravelSegment[];
  totalTime: string;
  totalCost: number;
}

export interface UniversityRowData {
  items: University[];
  rankingMode: 'europe' | 'world';
  favorites: (number | string)[];
  focusUniversity: (uni: University) => void;
  toggleFavorite: (e: React.MouseEvent, rank: number | string) => void;
}
