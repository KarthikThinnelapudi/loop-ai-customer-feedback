const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const validExtensions = new Set([".ts", ".tsx", ".prisma", ".css", ".js"]);

let totalLines = 0;
let totalFiles = 0;
const directoryStats = {};

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", "dist", "build"].includes(entry.name)) {
        continue;
      }
      scanDir(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (validExtensions.has(ext)) {
        const content = fs.readFileSync(fullPath, "utf8");
        const lines = content.split("\n").length;
        totalLines += lines;
        totalFiles++;

        const relDir = path.relative(rootDir, dir) || "root";
        const topDir = relDir.split(path.sep)[0];
        directoryStats[topDir] = (directoryStats[topDir] || 0) + lines;
      }
    }
  }
}

scanDir(rootDir);

console.log("==================================================");
console.log("📊 CUSTOMERLOOP PROJECT LINES OF CODE STATS");
console.log("==================================================");
console.log(`• Total Source Files: ${totalFiles}`);
console.log(`• Total Lines of Code: ${totalLines.toLocaleString()}\n`);
console.log("📁 Breakdown by Directory:");
Object.entries(directoryStats)
  .sort((a, b) => b[1] - a[1])
  .forEach(([dir, lines]) => {
    console.log(`  - ${dir}/: ${lines.toLocaleString()} lines`);
  });
console.log("==================================================");
