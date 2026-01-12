/**
 * Technology icon mapping utilities
 * Provides consistent icons for technology badges across the application
 */

/**
 * Get emoji icon for a technology
 * @param tech - Technology name
 * @returns Emoji icon representing the technology
 * 
 * @example
 * getTechIcon('Python') // => '🐍'
 * getTechIcon('JavaScript') // => '🟨'
 */
export function getTechIcon(tech: string): string {
  const techLower = tech.toLowerCase();
  
  // Programming Languages
  if (techLower.includes('python')) return '🐍';
  if (techLower.includes('javascript') || techLower.includes('js')) return '🟨';
  if (techLower.includes('typescript') || techLower.includes('ts')) return '🔷';
  if (techLower.includes('java') && !techLower.includes('script')) return '☕';
  if (techLower.includes('c++') || techLower.includes('cpp')) return '⚙️';
  if (techLower.includes('rust')) return '🦀';
  if (techLower.includes('go') || techLower === 'golang') return '🐹';
  if (techLower.includes('ruby')) return '💎';
  if (techLower.includes('php')) return '🐘';
  if (techLower.includes('swift')) return '🍎';
  if (techLower.includes('kotlin')) return '🟣';
  if (techLower.includes('scala')) return '🔴';
  if (techLower.includes('haskell')) return '🟪';
  if (techLower.includes('elixir')) return '💜';
  if (techLower.includes('clojure')) return '🟢';
  
  // Frameworks & Libraries
  if (techLower.includes('react')) return '⚛️';
  if (techLower.includes('vue')) return '💚';
  if (techLower.includes('angular')) return '🅰️';
  if (techLower.includes('node')) return '🟢';
  if (techLower.includes('django')) return '🎸';
  if (techLower.includes('flask')) return '🍶';
  if (techLower.includes('rails')) return '🛤️';
  
  // DevOps & Infrastructure
  if (techLower.includes('docker')) return '🐳';
  if (techLower.includes('kubernetes') || techLower.includes('k8s')) return '☸️';
  if (techLower.includes('aws')) return '☁️';
  if (techLower.includes('azure')) return '🔵';
  if (techLower.includes('gcp') || techLower.includes('google cloud')) return '🌈';
  
  // Databases
  if (techLower.includes('postgres') || techLower.includes('postgresql')) return '🐘';
  if (techLower.includes('mysql')) return '🐬';
  if (techLower.includes('mongo')) return '🍃';
  if (techLower.includes('redis')) return '🔴';
  
  // Default
  return '📦';
}

/**
 * Check if a tag is a technology (vs a topic)
 * @param tag - Tag to check
 * @returns true if the tag is a known technology
 */
export function isTechnology(tag: string): boolean {
  const techKeywords = [
    'python', 'javascript', 'java', 'c++', 'typescript', 'rust', 'go', 'ruby', 
    'php', 'swift', 'kotlin', 'react', 'node', 'docker', 'kubernetes', 'k8s',
    'vue', 'angular', 'django', 'flask', 'rails', 'postgres', 'mysql', 'mongo',
    'redis', 'aws', 'azure', 'gcp', 'scala', 'haskell', 'elixir', 'clojure'
  ];
  
  const tagLower = tag.toLowerCase();
  return techKeywords.some(keyword => tagLower.includes(keyword));
}

/**
 * Separate tags into technologies and topics
 * @param tags - Array of tags
 * @returns Object with technologies and topics arrays
 */
export function separateTechAndTopics(tags: string[]): {
  technologies: string[];
  topics: string[];
} {
  const technologies: string[] = [];
  const topics: string[] = [];
  
  for (const tag of tags) {
    if (isTechnology(tag)) {
      technologies.push(tag);
    } else {
      topics.push(tag);
    }
  }
  
  return { technologies, topics };
}
