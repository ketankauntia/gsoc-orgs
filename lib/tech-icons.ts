import { canonicalTechnology } from "./vocabulary/catalog";

const ICONS: Record<string, string> = {
  python: "🐍", javascript: "🟨", typescript: "🔷", java: "☕",
  c: "⚙️", cpp: "⚙️", csharp: "⚙️", "c-cpp": "⚙️", rust: "🦀",
  go: "🐹", ruby: "💎", php: "🐘", swift: "🍎", kotlin: "🟣",
  scala: "🔴", haskell: "🟪", elixir: "💜", clojure: "🟢",
  react: "⚛️", "react-native": "⚛️", vue: "💚", angular: "🅰️",
  nodejs: "🟢", django: "🎸", flask: "🍶", rails: "🛤️",
  docker: "🐳", kubernetes: "☸️", k8s: "☸️", aws: "☁️",
  azure: "🔵", gcp: "🌈", "google-cloud": "🌈", postgresql: "🐘",
  postgres: "🐘", mysql: "🐬", mongodb: "🍃", mongo: "🍃", redis: "🔴",
};

/** Exact canonical lookup: substrings such as `go` in `django` never match. */
export function getTechIcon(tech: string): string {
  return ICONS[canonicalTechnology(tech).slug] ?? "📦";
}

const TECHNOLOGY_SLUGS = new Set(Object.keys(ICONS));

export function isTechnology(tag: string): boolean {
  return TECHNOLOGY_SLUGS.has(canonicalTechnology(tag).slug);
}

export function separateTechAndTopics(tags: string[]): {
  technologies: string[];
  topics: string[];
} {
  const technologies: string[] = [];
  const topics: string[] = [];

  for (const tag of tags) {
    (isTechnology(tag) ? technologies : topics).push(tag);
  }

  return { technologies, topics };
}
