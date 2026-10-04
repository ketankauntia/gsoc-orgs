// Display labels for the lowercase technology and topic values in the archive.
// Technologies are mostly proper nouns (title case); topics read as sentence case.

const SPECIAL: Record<string, string> = {
  c: "C", "c++": "C++", "c#": "C#", r: "R", go: "Go", golang: "Go", d: "D",
  css: "CSS", css3: "CSS3", html: "HTML", html5: "HTML5", javascript: "JavaScript", typescript: "TypeScript", php: "PHP",
  api: "API", apis: "APIs", ai: "AI", ml: "ML", llm: "LLM", llms: "LLMs", nlp: "NLP", llvm: "LLVM", sql: "SQL", nosql: "NoSQL",
  gpu: "GPU", cpu: "CPU", ios: "iOS", "android/ios": "Android/iOS", mysql: "MySQL", postgresql: "PostgreSQL", mongodb: "MongoDB",
  sqlite: "SQLite", mariadb: "MariaDB", redis: "Redis", opengl: "OpenGL", opencl: "OpenCL", opencv: "OpenCV", webgl: "WebGL",
  webgpu: "WebGPU", "node.js": "Node.js", nodejs: "Node.js", node: "Node", "vue.js": "Vue.js", vuejs: "Vue.js", "next.js": "Next.js",
  "react native": "React Native", graphql: "GraphQL", jquery: "jQuery", webassembly: "WebAssembly", wasm: "Wasm", numpy: "NumPy",
  scipy: "SciPy", pytorch: "PyTorch", tensorflow: "TensorFlow", "scikit-learn": "scikit-learn", jax: "JAX", cuda: "CUDA",
  ros: "ROS", ros2: "ROS 2", qt: "Qt", gtk: "GTK", "gtk+": "GTK+", json: "JSON", xml: "XML", yaml: "YAML", rest: "REST",
  x86: "x86", "x86-64": "x86-64", "x86_64": "x86-64", arm: "Arm", "risc-v": "RISC-V", fpga: "FPGA", vhdl: "VHDL", rtl: "RTL",
  "3d": "3D", "2d": "2D", vfx: "VFX", ui: "UI", ux: "UX", "ui/ux": "UI/UX", gis: "GIS", iot: "IoT", ci: "CI", "ci/cd": "CI/CD",
  devops: "DevOps", aws: "AWS", gcp: "GCP", k8s: "K8s", github: "GitHub", gitlab: "GitLab", latex: "LaTeX", matlab: "MATLAB",
  ocaml: "OCaml", "objective-c": "Objective-C", cmake: "CMake", webrtc: "WebRTC", http: "HTTP", sdr: "SDR", vr: "VR", ar: "AR",
  xr: "XR", os: "OS", jvm: "JVM", gnu: "GNU", kde: "KDE", gnome: "GNOME", ebpf: "eBPF", bpf: "BPF", dns: "DNS", tls: "TLS",
  ssl: "SSL", ipfs: "IPFS", p2p: "P2P", lidar: "LiDAR", slam: "SLAM", cad: "CAD", pdf: "PDF", svg: "SVG", ide: "IDE", cli: "CLI",
  gui: "GUI", sdk: "SDK", orm: "ORM", jit: "JIT", hpc: "HPC", mpi: "MPI", openmp: "OpenMP", fortran: "Fortran", rdf: "RDF",
  sparql: "SPARQL", osm: "OSM", openstreetmap: "OpenStreetMap", fastapi: "FastAPI", sympy: "SymPy", pandas: "pandas",
  jupyter: "Jupyter", gstreamer: "GStreamer", ffmpeg: "FFmpeg", javafx: "JavaFX", wxwidgets: "wxWidgets", pyqt: "PyQt",
  sbom: "SBOM", spdx: "SPDX", l10n: "L10n", i18n: "i18n", "github actions": "GitHub Actions", "artificial intelligence": "Artificial intelligence", "machine learning": "Machine learning",
};

const norm = (value: string) => value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
const capital = (word: string) => word.replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase("en"));

function build(value: string, title: boolean) {
  const key = norm(value);
  if (SPECIAL[key]) return SPECIAL[key];
  let first = true;
  return key.split(/(\s+|\/)/).map((part) => {
    if (!part || /^(\s+|\/)$/.test(part)) return part;
    const special = SPECIAL[part];
    const out = special ?? (title || first ? capital(part) : part);
    first = false;
    return out;
  }).join("");
}

export const techLabel = (value: string) => build(value, true);
export const topicLabel = (value: string) => build(value, false);

/** Two-letter monogram for an organization without a logo. */
export function initials(name: string) {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const picked = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2);
  return picked.toLocaleUpperCase("en");
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
/** Spelled out up to twelve, digits after; capitalised for the start of a sentence. */
export function countWord(value: number, start = false) {
  const word = value >= 0 && value < WORDS.length ? WORDS[value] : value.toLocaleString("en-US");
  return start ? capital(word) : word;
}
