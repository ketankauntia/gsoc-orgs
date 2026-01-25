/**
 * Generate Trending Snapshot Data
 * 
 * Generates trending snapshots for organizations, projects, tech-stack, and topics
 * across daily, weekly, monthly, and yearly ranges.
 * 
 * Run with: npm run generate:trending
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const OUTPUT_DIR = path.join(__dirname, '..', 'new-api-details', 'trending');

// Configuration
const TOP_ITEMS_LIMIT = 100; // Maximum items per snapshot

type TrendingEntity = 'organizations' | 'projects' | 'tech-stack' | 'topics';
type TrendingRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface TrendingItem {
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

interface TrendingSnapshot {
  entity: TrendingEntity;
  range: TrendingRange;
  snapshot_at: string; // ISO timestamp - generation time (single source of truth)
  items: TrendingItem[];
  meta: {
    version: number;
    total_items: number;
  };
}

/**
 * Load previous snapshot to calculate changes
 * Checks both latest.json and archive files
 */
function loadPreviousSnapshot(entity: TrendingEntity, range: TrendingRange): TrendingSnapshot | null {
  try {
    // First try latest.json
    const latestPath = path.join(OUTPUT_DIR, entity, `${range}.json`);
    if (fs.existsSync(latestPath)) {
      const content = fs.readFileSync(latestPath, 'utf-8');
      return JSON.parse(content) as TrendingSnapshot;
    }

    // If latest doesn't exist, try to find most recent archive file
    const rangeDir = path.join(OUTPUT_DIR, entity, range);
    if (fs.existsSync(rangeDir)) {
      const files = fs.readdirSync(rangeDir)
        .filter((f) => f.endsWith('.json'))
        .sort()
        .reverse();

      if (files.length > 0) {
        const mostRecent = files[0];
        const archivePath = path.join(rangeDir, mostRecent);
        const content = fs.readFileSync(archivePath, 'utf-8');
        return JSON.parse(content) as TrendingSnapshot;
      }
    }
  } catch (error) {
    console.warn(`[WARN] Could not load previous snapshot for ${entity}/${range}:`, error);
  }
  return null;
}

/**
 * Calculate change and change_percent
 */
function calculateChange(current: number, previous: number): { change: number; change_percent: number } {
  const change = current - previous;
  const change_percent = previous > 0 ? (change / previous) * 100 : (current > 0 ? 100 : 0);
  return { change, change_percent };
}

/**
 * Generate trending organizations
 */
async function generateOrganizationsTrending(range: TrendingRange): Promise<TrendingItem[]> {
  console.log(`[FETCH] Loading organizations for ${range}...`);
  
  const organizations = await prisma.organizations.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      total_projects: true,
      img_r2_url: true,
      logo_r2_url: true,
      image_url: true,
      category: true,
    },
    orderBy: {
      total_projects: 'desc',
    },
  });

  const previousSnapshot = loadPreviousSnapshot('organizations', range);
  const previousMap = new Map<string, number>();
  
  if (previousSnapshot) {
    previousSnapshot.items.forEach((item) => {
      previousMap.set(item.slug, item.current_value);
    });
  }

  const items: TrendingItem[] = organizations
    .map((org) => {
      const currentValue = org.total_projects || 0;
      const previousValue = previousMap.get(org.slug) || currentValue;
      const { change, change_percent } = calculateChange(currentValue, previousValue);

      return {
        id: org.id,
        slug: org.slug,
        name: org.name,
        change,
        change_percent,
        current_value: currentValue,
        previous_value: previousValue,
        rank: 0,
        metadata: {
          img_r2_url: org.img_r2_url,
          logo_r2_url: org.logo_r2_url,
          image_url: org.image_url,
          total_projects: org.total_projects,
          category: org.category,
        },
      };
    })
    .sort((a, b) => {
      // Stable ranking: by current_value desc, then by slug for tie-breaker
      if (b.current_value !== a.current_value) {
        return b.current_value - a.current_value;
      }
      return a.slug.localeCompare(b.slug);
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }))
    .slice(0, TOP_ITEMS_LIMIT);

  return items;
}

/**
 * Generate trending projects
 */
async function generateProjectsTrending(range: TrendingRange): Promise<TrendingItem[]> {
  console.log(`[FETCH] Loading projects for ${range}...`);
  
  const projects = await prisma.projects.findMany({
    select: {
      project_id: true,
      project_title: true,
      org_slug: true,
      org_name: true,
      year: true,
    },
    distinct: ['project_id'],
    orderBy: {
      year: 'desc',
    },
    take: TOP_ITEMS_LIMIT,
  });

  const previousSnapshot = loadPreviousSnapshot('projects', range);
  const previousMap = new Map<string, number>();
  
  if (previousSnapshot) {
    previousSnapshot.items.forEach((item) => {
      previousMap.set(item.slug, item.current_value);
    });
  }

  const items: TrendingItem[] = projects
    .map((project) => {
      const slug = project.project_id;
      const currentValue = 1;
      const previousValue = previousMap.get(slug) || currentValue;
      const { change, change_percent } = calculateChange(currentValue, previousValue);

      return {
        id: project.project_id,
        slug,
        name: project.project_title || project.project_id,
        change,
        change_percent,
        current_value: currentValue,
        previous_value: previousValue,
        rank: 0,
        metadata: {
          org_slug: project.org_slug,
          org_name: project.org_name,
          year: project.year,
        },
      };
    })
    .sort((a, b) => {
      // Stable ranking: by current_value desc, then by id for tie-breaker
      if (b.current_value !== a.current_value) {
        return b.current_value - a.current_value;
      }
      return a.id.localeCompare(b.id);
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  return items;
}

/**
 * Generate trending tech-stack
 */
async function generateTechStackTrending(range: TrendingRange): Promise<TrendingItem[]> {
  console.log(`[FETCH] Loading tech-stack for ${range}...`);
  
  const organizations = await prisma.organizations.findMany({
    select: {
      technologies: true,
      total_projects: true,
    },
  });

  const techMap = new Map<string, { name: string; orgCount: number; projectCount: number }>();

  organizations.forEach((org) => {
    (org.technologies || []).forEach((tech) => {
      if (!techMap.has(tech)) {
        techMap.set(tech, {
          name: tech,
          orgCount: 0,
          projectCount: 0,
        });
      }
      const techData = techMap.get(tech)!;
      techData.orgCount += 1;
      techData.projectCount += org.total_projects || 0;
    });
  });

  const previousSnapshot = loadPreviousSnapshot('tech-stack', range);
  const previousMap = new Map<string, number>();
  
  if (previousSnapshot) {
    previousSnapshot.items.forEach((item) => {
      previousMap.set(item.slug, item.current_value);
    });
  }

  const items: TrendingItem[] = Array.from(techMap.entries())
    .map(([tech, data]) => {
      const slug = tech.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const currentValue = data.orgCount;
      const previousValue = previousMap.get(slug) || currentValue;
      const { change, change_percent } = calculateChange(currentValue, previousValue);

      return {
        id: slug,
        slug,
        name: data.name,
        change,
        change_percent,
        current_value: currentValue,
        previous_value: previousValue,
        rank: 0,
        metadata: {
          org_count: data.orgCount,
          project_count: data.projectCount,
        },
      };
    })
    .sort((a, b) => {
      // Stable ranking: by current_value desc, then by slug for tie-breaker
      if (b.current_value !== a.current_value) {
        return b.current_value - a.current_value;
      }
      return a.slug.localeCompare(b.slug);
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }))
    .slice(0, TOP_ITEMS_LIMIT);

  return items;
}

/**
 * Generate trending topics
 */
async function generateTopicsTrending(range: TrendingRange): Promise<TrendingItem[]> {
  console.log(`[FETCH] Loading topics for ${range}...`);
  
  const organizations = await prisma.organizations.findMany({
    select: {
      topics: true,
      total_projects: true,
    },
  });

  const topicMap = new Map<string, { name: string; orgCount: number; projectCount: number }>();

  organizations.forEach((org) => {
    (org.topics || []).forEach((topic) => {
      if (!topicMap.has(topic)) {
        topicMap.set(topic, {
          name: topic,
          orgCount: 0,
          projectCount: 0,
        });
      }
      const topicData = topicMap.get(topic)!;
      topicData.orgCount += 1;
      topicData.projectCount += org.total_projects || 0;
    });
  });

  const previousSnapshot = loadPreviousSnapshot('topics', range);
  const previousMap = new Map<string, number>();
  
  if (previousSnapshot) {
    previousSnapshot.items.forEach((item) => {
      previousMap.set(item.slug, item.current_value);
    });
  }

  const items: TrendingItem[] = Array.from(topicMap.entries())
    .map(([topic, data]) => {
      const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const currentValue = data.orgCount;
      const previousValue = previousMap.get(slug) || currentValue;
      const { change, change_percent } = calculateChange(currentValue, previousValue);

      return {
        id: slug,
        slug,
        name: data.name,
        change,
        change_percent,
        current_value: currentValue,
        previous_value: previousValue,
        rank: 0,
        metadata: {
          organization_count: data.orgCount,
          project_count: data.projectCount,
        },
      };
    })
    .sort((a, b) => {
      // Stable ranking: by current_value desc, then by slug for tie-breaker
      if (b.current_value !== a.current_value) {
        return b.current_value - a.current_value;
      }
      return a.slug.localeCompare(b.slug);
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }))
    .slice(0, TOP_ITEMS_LIMIT);

  return items;
}

/**
 * Write snapshot atomically (temp file → rename)
 */
function writeSnapshotAtomic(filePath: string, data: TrendingSnapshot): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}

/**
 * Get ISO week number (ISO-8601: Monday start, week 1 is first week with Thursday)
 */
function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/**
 * Get archive identifier for file naming
 * - Daily: YYYY-MM-DD
 * - Weekly: YYYY-Www (ISO-8601 week format)
 * - Monthly: YYYY-MM
 * - Yearly: YYYY
 */
function getArchiveIdentifier(range: TrendingRange): { year: number; month?: number; week?: number } {
  const now = new Date();
  const year = now.getFullYear();
  
  if (range === 'yearly') {
    return { year };
  }
  
  if (range === 'weekly') {
    const { year: isoYear, week } = getISOWeek(now);
    return { year: isoYear, week };
  }
  
  const month = now.getMonth() + 1;
  return { year, month };
}

/**
 * Generate trending snapshot for a specific entity and range
 */
async function generateSnapshot(entity: TrendingEntity, range: TrendingRange): Promise<void> {
  console.log(`[GENERATE] Generating ${entity}/${range}...`);

  let items: TrendingItem[];

  switch (entity) {
    case 'organizations':
      items = await generateOrganizationsTrending(range);
      break;
    case 'projects':
      items = await generateProjectsTrending(range);
      break;
    case 'tech-stack':
      items = await generateTechStackTrending(range);
      break;
    case 'topics':
      items = await generateTopicsTrending(range);
      break;
    default:
      throw new Error(`Unknown entity: ${entity}`);
  }

  const snapshotAt = new Date().toISOString();
  const snapshot: TrendingSnapshot = {
    entity,
    range,
    snapshot_at: snapshotAt, // Single source of truth for generation time
    items,
    meta: {
      version: 1,
      total_items: items.length,
    },
  };

  const archiveId = getArchiveIdentifier(range);
  const rangeDir = path.join(OUTPUT_DIR, entity, range);
  
  // Write archive file with appropriate naming
  let archiveFileName: string;
  if (range === 'yearly') {
    archiveFileName = `${archiveId.year}.json`;
  } else if (range === 'weekly') {
    // ISO-8601 week format: YYYY-Www
    archiveFileName = `${archiveId.year}-W${String(archiveId.week).padStart(2, '0')}.json`;
  } else {
    // Daily/Monthly: YYYY-MM or YYYY-MM-DD
    archiveFileName = `${archiveId.year}-${String(archiveId.month).padStart(2, '0')}.json`;
  }
  
  const archivePath = path.join(rangeDir, archiveFileName);
  writeSnapshotAtomic(archivePath, snapshot);
  console.log(`[GENERATE] ✓ Created archive ${entity}/${range}/${archiveFileName} with ${items.length} items`);

  // Also write latest.json for current snapshot
  const latestPath = path.join(OUTPUT_DIR, entity, `${range}.json`);
  writeSnapshotAtomic(latestPath, snapshot);
  console.log(`[GENERATE] ✓ Updated latest ${entity}/${range}.json`);
}

/**
 * Main function
 */
async function main() {
  console.log('[START] Generating trending snapshots...');

  const entities: TrendingEntity[] = ['organizations', 'projects', 'tech-stack', 'topics'];
  const ranges: TrendingRange[] = ['daily', 'weekly', 'monthly', 'yearly'];

  try {
    for (const entity of entities) {
      for (const range of ranges) {
        await generateSnapshot(entity, range);
      }
    }

    console.log('[COMPLETE] All trending snapshots generated successfully!');
  } catch (error) {
    console.error('[ERROR] Failed to generate trending snapshots:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
