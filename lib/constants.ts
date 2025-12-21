/**
 * Application constants
 * Centralized configuration for URLs and other constants
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gsocorganizationsguide.com';

/**
 * Generate a full URL for a given path
 */
export function getFullUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

/**
 * Common URL paths
 */
export const URLS = {
  HOME: SITE_URL,
  ORGANIZATIONS: getFullUrl('/organizations'),
  TECH_STACK: getFullUrl('/tech-stack'),
  TOPICS: getFullUrl('/topics'),
  ABOUT: getFullUrl('/about'),
  CONTACT: getFullUrl('/contact'),
  PRIVACY_POLICY: getFullUrl('/privacy-policy'),
  TERMS_AND_CONDITIONS: getFullUrl('/terms-and-conditions'),
  SITEMAP: getFullUrl('/sitemap.xml'),
} as const;

