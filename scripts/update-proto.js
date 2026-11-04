/**
 * WAProto Update Script
 * By FgsiDev
 * https://github.com/FgsiDev/Baileys
 * No Remove Credit the script or You Gay!
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(process.cwd(), "node_modules");
const BASE = "https://raw.githubusercontent.com/FgsiDev/Baileys/v5/WAProto";

function findFiles(dir, result = []) {
  if (!fs.existsSync(dir)) return result;

  for (const file of fs.readdirSync(dir)) {
    const p = path.join(dir, file);

    let stat;
    try {
      stat = fs.statSync(p);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      findFiles(p, result);
    } else if (/\.(js|cjs|mjs|ts)$/.test(file)) {
      result.push(p);
    }
  }

  return result;
}

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(download(res.headers.location));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      let data = "";
      res.setEncoding("utf8");
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

(async () => {
  console.log("🔍 Searching node_modules...");

  const files = findFiles(ROOT);
  const packages = new Set();

  for (const file of files) {
    try {
      if (fs.readFileSync(file, "utf8").includes("web.whatsapp.com")) {
        const rel = path.relative(ROOT, file).split(path.sep);

        const pkg = rel[0].startsWith("@")
          ? `${rel[0]}/${rel[1]}`
          : rel[0];

        packages.add(pkg);
      }
    } catch {}
  }

  console.log(`📦 Found ${packages.size} package(s)\n`);

  for (const pkg of packages) {
    const waProto = path.join(ROOT, pkg, "WAProto");

    if (!fs.existsSync(waProto)) {
      console.log(`⚠️  ${pkg} → WAProto not found`);
      continue;
    }

    for (const name of ["index.d.ts", "index.js"]) {
      const target = path.join(waProto, name);

      try {
        const content = await download(`${BASE}/${name}`);
        fs.writeFileSync(target, content);

        console.log(`✅ ${pkg}/WAProto/${name}`);
      } catch (err) {
        console.log(`❌ ${pkg}/WAProto/${name}: ${err.message}`);
      }
    }
  }
})();