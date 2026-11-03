import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const postsDir = path.join(root, "content", "posts");
const sources = Object.fromEntries(
  fs.readdirSync(postsDir).filter((file) => file.endsWith(".md")).sort()
    .map((file) => [file, fs.readFileSync(path.join(postsDir, file), "utf8")]),
);
const target = path.join(root, "lib", "generated", "blog-sources.json");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${JSON.stringify(sources, null, 2)}\n`);
console.log(`Bundled ${Object.keys(sources).length} blog sources.`);
