/**
 * Types for Homepage Snapshot Data
 */

import { readCatalogJson } from './catalog-data';

export interface HomepageData {
  slug: 'homepage';
  published_at: string;

  featured_organizations: FeaturedOrg[];

  metrics: {
    total_organizations: number;
    active_organizations: number;
    total_projects: number;
  };

  meta: {
    version: number;
    generated_at: string;
  };
}

export interface FeaturedOrg {
  id: string;
  name: string;
  slug: string;
  img_r2_url: string | null;
}

/**
 * Load homepage snapshot data
 */
export async function loadHomepageData(): Promise<HomepageData | null> {
  try {
    return await readCatalogJson<HomepageData>(`homepage.json`);
  } catch {
    return null;
  }
}
