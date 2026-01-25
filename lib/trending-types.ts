/**
 * Types for Trending Snapshot Data
 * 
 * Trending data represents snapshots of entities over time.
 * Data is stored in /new-api-details/trending/{entity}/{range}.json
 */

import * as fs from 'fs';
import * as path from 'path';

export type TrendingEntity = 'organizations' | 'projects' | 'tech-stack' | 'topics';
export type TrendingRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface TrendingSnapshot {
  entity: TrendingEntity;
  range: TrendingRange;
  snapshot_at: string; // ISO timestamp - generation time (single source of truth)
  items: TrendingItem[];
  meta: {
    version: number;
    total_items: number;
  };
}

export interface TrendingItem {
  id: string;
  slug: string;
  name: string;
  change: number;
  change_percent: number;
  current_value: number;
  previous_value: number;
  rank: number;
  metadata?: Record<string, unknown>;
}

export interface TrendingOrganizationItem extends TrendingItem {
  metadata: {
    img_r2_url?: string | null;
    logo_r2_url?: string | null;
    image_url?: string | null;
    total_projects?: number;
    category?: string;
  };
}

export interface TrendingProjectItem extends TrendingItem {
  metadata: {
    org_slug?: string;
    org_name?: string;
    year?: number;
  };
}

export interface TrendingTechStackItem extends TrendingItem {
  metadata: {
    org_count?: number;
    project_count?: number;
  };
}

export interface TrendingTopicItem extends TrendingItem {
  metadata: {
    organization_count?: number;
    project_count?: number;
  };
}

/**
 * Load trending snapshot data for a specific entity and range
 * 
 * @param entity - The entity type (organizations, projects, tech-stack, topics)
 * @param range - The time range (daily, weekly, monthly, yearly)
 * @param year - Optional year for archive view (e.g., 2024)
 * @param month - Optional month for archive view (1-12, only for monthly/weekly/daily ranges)
 * @returns The trending snapshot data, or null if not found
 */
export async function loadTrendingSnapshot(
  entity: TrendingEntity,
  range: TrendingRange = 'monthly',
  year?: number,
  month?: number
): Promise<TrendingSnapshot | null> {
  try {
    let filePath: string;
    const baseDir = path.join(process.cwd(), 'new-api-details', 'trending', entity);

    // Archive view: use year/month/week-segmented file
    if (year !== undefined) {
      if (range === 'yearly') {
        filePath = path.join(baseDir, 'yearly', `${year}.json`);
      } else if (range === 'weekly' && month !== undefined) {
        // Weekly uses ISO week format: YYYY-Www.json
        // Note: month parameter is used to approximate week (1-12 maps to weeks)
        // For exact week lookup, would need week parameter, but month is acceptable for archive discovery
        const week = Math.ceil((month * 30.44) / 7); // Approximate conversion
        const weekStr = String(week).padStart(2, '0');
        filePath = path.join(baseDir, 'weekly', `${year}-W${weekStr}.json`);
      } else if (month !== undefined) {
        // Daily/Monthly: YYYY-MM.json or YYYY-MM-DD.json
        const monthStr = String(month).padStart(2, '0');
        filePath = path.join(baseDir, range, `${year}-${monthStr}.json`);
      } else {
        // Year provided but no month - fallback to latest
        filePath = path.join(baseDir, `${range}.json`);
      }
    } else {
      // Current view: use latest snapshot
      filePath = path.join(baseDir, `${range}.json`);
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[TRENDING] File not found: ${filePath}`);
      }
      return null;
    }

    // Read and parse JSON file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent) as TrendingSnapshot;
    return data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `[TRENDING] Failed to load ${entity}/${range}${year ? `/${year}${month ? `-${month}` : ''}` : ''}.json:`,
        error
      );
    }
    return null;
  }
}

/**
 * Validate trending entity slug
 */
export function isValidTrendingEntity(
  slug: string
): slug is TrendingEntity {
  return ['organizations', 'projects', 'tech-stack', 'topics'].includes(slug);
}

/**
 * Validate trending range parameter
 */
export function isValidTrendingRange(
  range: string | null
): range is TrendingRange {
  if (!range) return false;
  return ['daily', 'weekly', 'monthly', 'yearly'].includes(range);
}
