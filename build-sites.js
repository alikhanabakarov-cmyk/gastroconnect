const fs = require("fs");
const path = require("path");

const root = __dirname;
const outDir = path.join(root, "dist");
const skip = new Set([
  ".git",
  ".openai",
  "dist",
  "node_modules",
  "build-sites.js",
  "package.json",
  "package-lock.json",
]);

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    if (entry.name.endsWith(".zip")) continue;
    if (entry.name.startsWith("preview-")) continue;

    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(source, target);
    } else {
      fs.copyFileSync(source, target);
    }
  }
}

fs.rmSync(outDir, { recursive: true, force: true });
copyDir(root, outDir);
fs.copyFileSync(path.join(root, "index.html"), path.join(outDir, "404.html"));
console.log(`Built static site into ${outDir}`);
