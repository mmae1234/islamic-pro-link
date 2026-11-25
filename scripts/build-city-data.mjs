// Regenerates, from the country-state-city package:
//   public/geo/cities/<COUNTRY>.json  { "<stateCode>": ["City A", ...] }  (names, sorted, de-duplicated)
//   public/geo/states/<COUNTRY>.json  [{ "name": "...", "isoCode": "..." }, ...]  (sorted by name)
// The site fetches just the selected country's files instead of bundling the
// full world lists (~8 MB cities, ~0.5 MB states).
//
// Run after upgrading country-state-city:  node scripts/build-city-data.mjs
import { createRequire } from "node:module";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { City, State } = require("country-state-city");

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

const statesDir = join(process.cwd(), "public", "geo", "states");
rmSync(statesDir, { recursive: true, force: true });
mkdirSync(statesDir, { recursive: true });
const statesByCountry = new Map();
for (const s of State.getAllStates()) {
  if (!statesByCountry.has(s.countryCode)) statesByCountry.set(s.countryCode, []);
  statesByCountry.get(s.countryCode).push({ name: s.name, isoCode: s.isoCode });
}
for (const [cc, list] of statesByCountry) {
  list.sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(join(statesDir, `${cc}.json`), JSON.stringify(list));
}
console.log(`Wrote ${statesByCountry.size} country state files to ${statesDir}`);
