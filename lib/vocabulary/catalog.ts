export type VocabularyKind = "technology" | "topic";

export type CanonicalVocabularyValue = {
  name: string;
  slug: string;
};

export type CanonicalVocabularyGroup = CanonicalVocabularyValue & {
  aliases: string[];
};

type VocabularyDefinition = CanonicalVocabularyValue & {
  aliases: readonly string[];
};

function definition(name: string, slug: string, aliases: readonly string[] = []): VocabularyDefinition {
  return { name, slug, aliases: [name, ...aliases] };
}

/**
 * Reviewed equivalences only. Punctuation is not stripped when looking up an
 * alias because it distinguishes values such as C, C++, C#, and C/C++.
 */
const TECHNOLOGIES: readonly VocabularyDefinition[] = [
  definition("C", "c", ["c language"]),
  definition("C++", "cpp", ["cpp", "c++11", "c++14", "c++17", "c++20"]),
  definition("C#", "csharp", ["c #"]),
  definition("C/C++", "c-cpp", ["c/c+", "c\\c++"]),
  definition(".NET", "dotnet", ["dotnet", "net"]),
  definition("Angular", "angular", ["angular.js", "angularjs"]),
  definition("Artificial intelligence", "artificial-intelligence", ["artificial intelligence"]),
  definition("Assembly", "assembly", ["assembly language"]),
  definition("Cesium", "cesium", ["cesiumjs"]),
  definition("Cross-platform", "cross-platform", ["crossplatform", "cross platform"]),
  definition("D", "d", ["dlang"]),
  definition("D3", "d3", ["d3.js", "d3js"]),
  definition("Data science", "data-science", ["data science", "datascience"]),
  definition("Deep learning", "deep-learning", ["deep learning", "deeplearning"]),
  definition("Ember", "ember", ["emberjs"]),
  definition("GitHub Actions", "github-actions", ["github actions"]),
  definition("Go", "go", ["golang"]),
  definition("GTK", "gtk", ["gtk+"]),
  definition("JavaScript", "javascript", ["js", "#js"]),
  definition("Julia", "julia", ["julialang"]),
  definition("JVM", "jvm", ["#jvm"]),
  definition("LLVM", "llvm", ["#llvm"]),
  definition("Machine learning", "machine-learning", ["machine learning", "machinelearning"]),
  definition("Meteor", "meteor", ["meteor.js", "meteorjs"]),
  definition("Microservices", "microservices", ["micro-services", "micro services"]),
  definition("Node.js", "nodejs", ["node", "node.js", "nodejs"]),
  definition("React", "react", ["react.js", "reactjs"]),
  definition("React Native", "react-native", ["react native", "reactnative"]),
  definition("RISC-V", "risc-v", ["riscv"]),
  definition("Scala", "scala", ["#scala", "#scala_lang", "scala.js"]),
  definition("VA-API", "va-api", ["vaapi"]),
  definition("Vue", "vue", ["vue.js", "vuejs"]),
];

const TOPICS: readonly VocabularyDefinition[] = [
  definition("AI", "ai", ["ai,"]),
  definition("AI/ML", "ai-ml", ["aiml"]),
  definition("C", "c"),
  definition("C++", "cpp"),
  definition("Artificial intelligence", "artificial-intelligence", ["artificial intelligence"]),
  definition("Asynchronous many-task systems", "asynchronous-many-task-systems", ["asynchronous many task systems", "asynchronous manytask systems"]),
  definition("Big data", "big-data", ["bigdata"]),
  definition("Bootloader", "bootloader", ["boot loader"]),
  definition("Checkpoint/restore", "checkpoint-restore", ["checkpoint restore"]),
  definition("Civic tech", "civic-tech", ["civic tech"]),
  definition("Cloud native", "cloud-native", ["cloudnative"]),
  definition("Compilers", "compilers", ["#compilers"]),
  definition("Computer vision", "computer-vision", ["computer vision"]),
  definition("Computational chemistry", "computational-chemistry", ["computational chemistry"]),
  definition("Cross-platform", "cross-platform", ["cross platform"]),
  definition("Cybersecurity", "cybersecurity", ["cyber security", "cyber-security"]),
  definition("Data mining", "data-mining", ["data mining"]),
  definition("Data science", "data-science", ["data science"]),
  definition("Deep learning", "deep-learning", ["deep learning"]),
  definition("DevOps", "devops", ["dev-ops"]),
  definition("Ecological forecasting", "ecological-forecasting", ["ecological forecasting,"]),
  definition("Education", "education", ["#education"]),
  definition("Email", "email", ["e-mail"]),
  definition("End-user application", "end-user-application", ["end user application"]),
  definition("Functional programming", "functional-programming", ["#functional-programming"]),
  definition("GenAI", "genai", ["gen ai"]),
  definition("Healthcare", "healthcare", ["health care", "health-care"]),
  definition("High-energy astrophysics", "high-energy-astrophysics", ["high energy astrophysics"]),
  definition("High-performance computing", "high-performance-computing", ["high performance computing"]),
  definition("High-performance data processing", "high-performance-data-processing", ["high performance data processing"]),
  definition("Human rights", "human-rights", ["humanrights"]),
  definition("In-memory data grid", "in-memory-data-grid", ["in memory data grid"]),
  definition("Low-level", "low-level", ["lowlevel"]),
  definition("Machine learning", "machine-learning", ["machine learning"]),
  definition("Malware analysis", "malware-analysis", ["malware analysis"]),
  definition("Microservices", "microservices", ["micro services", "micro-services"]),
  definition("ML Ops", "mlops", ["ml ops", "ml-ops"]),
  definition("Mobile apps", "mobile-apps", ["mobile apps"]),
  definition("Molecular simulation", "molecular-simulation", ["molecular simulation"]),
  definition("Nonprofit", "nonprofit", ["non-profit"]),
  definition("Object-oriented programming", "object-oriented-programming", ["object oriented programming"]),
  definition("Open data", "open-data", ["opendata"]),
  definition("Open science", "open-science", ["open science"]),
  definition("Open source", "open-source", ["opensource"]),
  definition("Operating system", "operating-system", ["operating system"]),
  definition("Programming language", "programming-language", ["programming language"]),
  definition("Programming languages", "programming-languages", ["#programming-languages"]),
  definition("Programming tools", "programming-tools", ["#programming-tools"]),
  definition("Real-time", "real-time", ["real time", "realtime"]),
  definition("Real-time communication", "real-time-communication", ["real time communication", "realtime communication"]),
  definition("Real-time communications", "real-time-communications", ["real time communications", "realtime communications"]),
  definition("Remote access", "remote-access", ["remote access"]),
  definition("Reverse engineering", "reverse-engineering", ["reverse engineering"]),
  definition("Sensor web", "sensor-web", ["sensorweb"]),
  definition("Software composition analysis", "software-composition-analysis", ["softwarecompositionanalysis"]),
  definition("Software-defined networking", "software-defined-networking", ["software defined networking"]),
  definition("Software-defined radio", "software-defined-radio", ["software defined radio"]),
  definition("Software-defined storage", "software-defined-storage", ["software defined storage"]),
  definition("Soft-matter physics", "soft-matter-physics", ["soft matter physics"]),
  definition("System on chip", "system-on-chip", ["system on chip"]),
  definition("Text editor", "text-editor", ["text editor"]),
  definition("Time series", "time-series", ["time series", "timeseries"]),
  definition("Version control", "version-control", ["version control"]),
  definition("Web apps", "web-apps", ["webapps"]),
  definition("Front-end", "front-end", ["frontend"]),
];

const DEFINITIONS: Record<VocabularyKind, readonly VocabularyDefinition[]> = {
  technology: TECHNOLOGIES,
  topic: TOPICS,
};

export function vocabularyAliasKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function presentCase(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function buildLookup(definitions: readonly VocabularyDefinition[]): ReadonlyMap<string, CanonicalVocabularyValue> {
  const lookup = new Map<string, CanonicalVocabularyValue>();
  for (const item of definitions) {
    for (const alias of item.aliases) {
      const key = vocabularyAliasKey(alias);
      const existing = lookup.get(key);
      if (existing && existing.slug !== item.slug) {
        throw new Error(`Vocabulary alias ${JSON.stringify(alias)} maps to both ${existing.slug} and ${item.slug}`);
      }
      lookup.set(key, { name: item.name, slug: item.slug });
    }
  }
  return lookup;
}

const LOOKUPS: Record<VocabularyKind, ReadonlyMap<string, CanonicalVocabularyValue>> = {
  technology: buildLookup(TECHNOLOGIES),
  topic: buildLookup(TOPICS),
};

export function canonicalizeVocabulary(kind: VocabularyKind, rawValue: string): CanonicalVocabularyValue {
  const key = vocabularyAliasKey(rawValue);
  const reviewed = LOOKUPS[kind].get(key);
  if (reviewed) return reviewed;

  const name = presentCase(rawValue);
  const slug = slugify(name);
  if (!slug) throw new Error(`Cannot create a ${kind} slug for ${JSON.stringify(rawValue)}`);
  return { name, slug };
}

export function canonicalTechnology(rawValue: string): CanonicalVocabularyValue {
  return canonicalizeVocabulary("technology", rawValue);
}

export function canonicalTopic(rawValue: string): CanonicalVocabularyValue {
  return canonicalizeVocabulary("topic", rawValue);
}

export function technologyHref(rawValue: string): string {
  return `/tech-stack/${canonicalTechnology(rawValue).slug}`;
}

export function topicHref(rawValue: string): string {
  return `/topics/${canonicalTopic(rawValue).slug}`;
}

export function vocabularyDefinitions(kind: VocabularyKind): readonly VocabularyDefinition[] {
  return DEFINITIONS[kind];
}

export function aliasesForCanonical(kind: VocabularyKind, slug: string): string[] {
  const item = DEFINITIONS[kind].find((candidate) => candidate.slug === slug);
  return item ? [...new Set(item.aliases.map((alias) => alias.trim()))] : [];
}

/** Highest observed spelling wins; ties are alphabetical. Reviewed names stay fixed. */
export function selectVocabularyDisplayNames(kind: VocabularyKind, rawValues: Iterable<string>): Map<string, string> {
  const reviewedNames = new Map(DEFINITIONS[kind].map((item) => [item.slug, item.name]));
  const counts = new Map<string, Map<string, number>>();
  for (const rawValue of rawValues) {
    const canonical = canonicalizeVocabulary(kind, rawValue);
    const name = reviewedNames.get(canonical.slug) ?? presentCase(rawValue);
    const names = counts.get(canonical.slug) ?? new Map<string, number>();
    names.set(name, (names.get(name) ?? 0) + 1);
    counts.set(canonical.slug, names);
  }
  return new Map([...counts].map(([slug, names]) => {
    const name = [...names]
      .sort(([leftName, leftCount], [rightName, rightCount]) => rightCount - leftCount || leftName.localeCompare(rightName))[0][0];
    return [slug, name];
  }));
}

export function buildVocabularyGroups(kind: VocabularyKind, rawValues: Iterable<string>): CanonicalVocabularyGroup[] {
  const values = [...rawValues];
  assertNoVocabularySlugCollisions(kind, values);
  const displayNames = selectVocabularyDisplayNames(kind, values);
  const groups = new Map<string, CanonicalVocabularyGroup>();
  for (const rawValue of values) {
    const canonical = canonicalizeVocabulary(kind, rawValue);
    const name = displayNames.get(canonical.slug) ?? canonical.name;
    const group = groups.get(canonical.slug) ?? { slug: canonical.slug, name, aliases: [name] };
    if (!group.aliases.includes(rawValue)) group.aliases.push(rawValue);
    groups.set(canonical.slug, group);
  }
  return [...groups.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

export function canonicalSlugForPath(kind: VocabularyKind, pathSlug: string): string | null {
  let decodedPath = pathSlug;
  try {
    decodedPath = decodeURIComponent(pathSlug);
  } catch {
    // Leave malformed percent-encoding untouched so it resolves to a safe slug
    // or reaches the normal not-found path instead of crashing the request.
  }

  const exactAlias = LOOKUPS[kind].get(vocabularyAliasKey(decodedPath));
  if (exactAlias) return exactAlias.slug;

  const normalizedPath = slugify(decodedPath);
  for (const item of DEFINITIONS[kind]) {
    if (item.slug === decodedPath) return item.slug;
    if (item.aliases.some((alias) => slugify(alias) === normalizedPath)) return item.slug;
  }

  try {
    return canonicalizeVocabulary(kind, decodedPath).slug;
  } catch {
    return null;
  }
}

export function assertNoVocabularySlugCollisions(kind: VocabularyKind, rawValues: Iterable<string>): void {
  const ownerBySlug = new Map<string, string>();
  for (const rawValue of rawValues) {
    const canonical = canonicalizeVocabulary(kind, rawValue);
    const identity = LOOKUPS[kind].has(vocabularyAliasKey(rawValue)) ? canonical.slug : vocabularyAliasKey(rawValue);
    const existing = ownerBySlug.get(canonical.slug);
    if (existing && existing !== identity) {
      throw new Error(
        `Unreviewed ${kind} slug collision for ${JSON.stringify(rawValue)} at ${JSON.stringify(canonical.slug)}; add an explicit alias or canonical definition`,
      );
    }
    ownerBySlug.set(canonical.slug, identity);
  }
}
