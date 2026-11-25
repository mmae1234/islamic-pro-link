// Regenerates public/geo/cities/<COUNTRY>.json from the country-state-city
// package: { "<stateCode>": ["City A", "City B", ...] }, names only, sorted,
// de-duplicated. The site fetches just the selected country's file instead of
// bundling the full ~8 MB world city list.
//
// Run after upgrading country-state-city:  node scripts/build-city-data.mjs
import { createRequire } from "node:module";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { City } = require("country-state-city");

const outDir = join(process.cwd(), "public", "geo", "cities");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const byCountry = new Map();
for (const c of City.getAllCities()) {
  if (!byCountry.has(c.countryCode)) byCountry.set(c.countryCode, new Map());
  const states = byCountry.get(c.countryCode);
  if (!states.has(c.stateCode)) states.set(c.stateCode, new Set());
  states.get(c.stateCode).add(c.name);
}

let files = 0;
for (const [cc, states] of byCountry) {
  const obj = {};
  for (const sc of [...states.keys()].sort()) {
    obj[sc] = [...states.get(sc)].sort((a, b) => a.localeCompare(b));
  }
  writeFileSync(join(outDir, `${cc}.json`), JSON.stringify(obj));
  files++;
}
console.log(`Wrote ${files} country files to ${outDir}`);
