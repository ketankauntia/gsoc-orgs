/**
 * Theme Configuration
 * Centralized design tokens for consistent styling across the application
 * 
 * This file defines semantic tokens that map to Tailwind classes.
 * Use these instead of hardcoding color values in components.
 */

// =============================================================================
// COLOR TOKENS
// =============================================================================

/**
 * Badge color variants for different types of content
 * Each variant provides bg, text, and optional dot colors as Tailwind classes
 */
export const badgeColors = {
  /** Technology badges - Blue theme */
  tech: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-400',
    border: 'border-blue-200',
  },
  /** Year badges - Teal theme */
  year: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    dot: 'bg-teal-400',
    border: 'border-teal-200',
  },
  /** Topic badges - Purple theme */
  topic: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-400',
    border: 'border-purple-200',
  },
  /** Category badges - Orange theme */
  category: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-400',
    border: 'border-orange-200',
  },
  /** Neutral/default badges */
  neutral: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
    border: 'border-gray-200',
  },
} as const;

/**
 * Difficulty level colors
 */
export const difficultyColors = {
  easy: 'bg-emerald-500',
  beginner: 'bg-emerald-500',
  medium: 'bg-amber-500',
  intermediate: 'bg-amber-500',
  hard: 'bg-orange-600',
  advanced: 'bg-orange-600',
  default: 'bg-gray-400',
} as const;

/**
 * Get difficulty color by level
 */
export function getDifficultyColor(difficulty?: string): string {
  if (!difficulty) return difficultyColors.default;
  const key = difficulty.toLowerCase() as keyof typeof difficultyColors;
  return difficultyColors[key] || difficultyColors.default;
}

/**
 * Primary action colors
 */
export const actionColors = {
  primary: {
    bg: 'bg-teal-600',
    hover: 'hover:bg-teal-700',
    text: 'text-white',
  },
  secondary: {
    bg: 'bg-gray-100',
    hover: 'hover:bg-gray-200',
    text: 'text-gray-900',
  },
} as const;

/**
 * Chart colors - Teal gradient for bar charts
 * Used across tech-stack charts, year charts, and other visualizations
 */
export const chartColors = {
  /** Teal gradient palette for bar charts (dark to light) */
  tealGradient: [
    '#0d9488', // teal-600
    '#14b8a6', // teal-500
    '#2dd4bf', // teal-400
    '#5eead4', // teal-300
    '#99f6e4', // teal-200
  ] as const,
  /** Extended palette (repeating for 10+ items) */
  tealGradientExtended: [
    '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4',
    '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4',
  ] as const,
  /** Accent colors for multi-series charts */
  accent: {
    primary: '#0d9488',   // teal-600
    secondary: '#14b8a6', // teal-500
    tertiary: '#2dd4bf',  // teal-400
  },
  /** Difficulty level colors for charts (hex values for recharts) */
  difficulty: {
    beginner: '#3b82f6',     // blue-500
    intermediate: '#22c55e', // green-500
    advanced: '#f97316',     // orange-500
    advancedFriendly: '#eab308', // yellow-500
    default: '#0d9488',      // teal-600
  },
  /** Grid and axis colors */
  grid: '#e5e7eb',        // gray-200
  axis: '#6b7280',        // gray-500
} as const;

/**
 * Get difficulty chart color by level name
 * @param level - Difficulty level string
 * @returns Hex color string
 */
export function getDifficultyChartColor(level: string): string {
  const levelLower = level.toLowerCase();
  if (levelLower.includes('beginner')) return chartColors.difficulty.beginner;
  if (levelLower.includes('intermediate')) return chartColors.difficulty.intermediate;
  if (levelLower.includes('advanced friendly')) return chartColors.difficulty.advancedFriendly;
  if (levelLower.includes('advanced')) return chartColors.difficulty.advanced;
  return chartColors.difficulty.default;
}

/**
 * Get bar color by index from the teal gradient
 * @param index - Bar index
 * @returns Hex color string
 */
export function getChartBarColor(index: number): string {
  return chartColors.tealGradientExtended[index % chartColors.tealGradientExtended.length];
}

// =============================================================================
// SPACING TOKENS
// =============================================================================

/**
 * Consistent spacing scale (maps to Tailwind spacing)
 */
export const spacing = {
  xs: '0.25rem',  // 1 - 4px
  sm: '0.5rem',   // 2 - 8px
  md: '1rem',     // 4 - 16px
  lg: '1.5rem',   // 6 - 24px
  xl: '2rem',     // 8 - 32px
  '2xl': '3rem',  // 12 - 48px
} as const;

// =============================================================================
// TYPOGRAPHY TOKENS
// =============================================================================

/**
 * Font size scale with line heights
 */
export const typography = {
  xs: { size: 'text-xs', lineHeight: 'leading-4' },
  sm: { size: 'text-sm', lineHeight: 'leading-5' },
  base: { size: 'text-base', lineHeight: 'leading-6' },
  lg: { size: 'text-lg', lineHeight: 'leading-7' },
  xl: { size: 'text-xl', lineHeight: 'leading-7' },
  '2xl': { size: 'text-2xl', lineHeight: 'leading-8' },
  '3xl': { size: 'text-3xl', lineHeight: 'leading-9' },
} as const;

// =============================================================================
// BORDER RADIUS TOKENS
// =============================================================================

/**
 * Border radius scale
 */
export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const;

// =============================================================================
// SHADOW TOKENS
// =============================================================================

/**
 * Shadow scale for elevation
 */
export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
} as const;

// =============================================================================
// Z-INDEX LAYERS
// =============================================================================

/**
 * Z-index scale for consistent layering
 */
export const zIndex = {
  dropdown: 'z-10',
  sticky: 'z-20',
  fixed: 'z-30',
  modalBackdrop: 'z-40',
  modal: 'z-50',
  popover: 'z-60',
  tooltip: 'z-70',
} as const;

// =============================================================================
// COMPONENT-SPECIFIC TOKENS
// =============================================================================

/**
 * Card styling tokens
 */
export const cardStyles = {
  base: 'bg-white border border-gray-200 rounded-xl',
  hover: 'hover:shadow-md hover:border-gray-300 transition-all',
  padding: {
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  },
} as const;

/**
 * Input styling tokens
 */
export const inputStyles = {
  base: 'border border-gray-200 rounded-lg bg-white',
  focus: 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
  padding: 'px-4 py-2',
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type BadgeColorType = keyof typeof badgeColors;
export type DifficultyType = keyof typeof difficultyColors;
export type SpacingType = keyof typeof spacing;
export type BorderRadiusType = keyof typeof borderRadius;
export type ShadowType = keyof typeof shadows;
