/** Canonical URL slugs shared by links and generated technology/topic datasets. */
const TECHNOLOGY_SLUG_ALIASES: Record<string, string> = {
  "c++": "cpp",
  "c/c++": "cpp",
  "c #": "csharp",
  "c#": "csharp",
  ".net": "dotnet",
  "node.js": "nodejs",
  node: "nodejs",
  "react.js": "react",
  reactjs: "react",
  "vue.js": "vue",
  vuejs: "vue",
  "angular.js": "angular",
  angularjs: "angular",
};

function basicSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function technologyToSlug(technology: string) {
  const normalized = technology.toLowerCase().trim();
  return TECHNOLOGY_SLUG_ALIASES[normalized] ?? basicSlug(normalized);
}

export function topicToSlug(topic: string) {
  return basicSlug(topic);
}

