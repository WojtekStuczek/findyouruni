/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface University {
  world_rank: number | string;
  europe_rank: number | string;
  name: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
  website?: string;
  specializations?: string[];
  nearest_airport?: { name: string; lat: number; lng: number; distance_km?: number };
  nearest_train_station?: { name: string; lat: number; lng: number; distance_km?: number };
}

export type CloudinaryUrlMap = Record<number, { thumb: string; full: string }>;

// Loaded at app start, used synchronously after init
export let universities: University[] = [];
export let cloudinaryUrls: CloudinaryUrlMap = {};

export async function loadAppData(): Promise<void> {
  const [uniRes, imgRes] = await Promise.all([
    fetch('/data/universities.json'),
    fetch('/data/cloudinaryUrls.json'),
  ]);
  universities = await uniRes.json();
  cloudinaryUrls = await imgRes.json();
}
