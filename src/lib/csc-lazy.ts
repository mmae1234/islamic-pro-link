/**
 * Lazy loaders for `country-state-city`.
 *
 * Countries and states load on demand from the package (small). Cities come
 * from per-country JSON files instead of the package's ~8 MB module.
 *
 * Each submodule is normalized so callers always use the same call signatures.
 *
 * On rejection (network error, chunk-load failure), the cached promise is
 * cleared so the next call retries instead of returning the same poisoned
 * promise forever.
 */

export type CountryItem = { name: string; isoCode: string };
export type StateItem = { name: string; isoCode: string; countryCode: string };
export type CityItem = { name: string; countryCode: string; stateCode: string };

export type CountryApi = { getAllCountries: () => CountryItem[] };
export type StateApi = { getStatesOfCountry: (countryCode: string) => StateItem[] };

let countryPromise: Promise<CountryApi> | null = null;
let statePromise: Promise<StateApi> | null = null;

export const loadCountry = (): Promise<CountryApi> => {
  if (!countryPromise) {
    countryPromise = import("country-state-city/lib/country")
      .then((mod: any) => {
        const api = mod.default ?? mod;
        return { getAllCountries: () => api.getAllCountries() } as CountryApi;
      })
      .catch((err) => {
        countryPromise = null; // allow retry on next call
        throw err;
      });
  }
  return countryPromise;
};

export const loadState = (): Promise<StateApi> => {
  if (!statePromise) {
    statePromise = import("country-state-city/lib/state")
      .then((mod: any) => {
        const api = mod.default ?? mod;
        return { getStatesOfCountry: (cc: string) => api.getStatesOfCountry(cc) } as StateApi;
      })
      .catch((err) => {
        statePromise = null;
        throw err;
      });
  }
  return statePromise;
};

// Cities: one small JSON file per country in /public/geo/cities (built by
// scripts/build-city-data.mjs), e.g. US = ~86 KB gzipped, instead of the
// package's ~8 MB all-countries module. Cached per country for the session.
type CountryCityIndex = Record<string, string[]>;
const cityFileCache = new Map<string, Promise<CountryCityIndex>>();

const loadCountryCities = (countryCode: string): Promise<CountryCityIndex> => {
  const cc = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return Promise.resolve({});
  let p = cityFileCache.get(cc);
  if (!p) {
    p = fetch(`/geo/cities/${cc}.json`)
      .then((res) => {
        if (res.status === 404) return {}; // country with no city data
        if (!res.ok) throw new Error(`City data request failed (${res.status})`);
        // Hosts with an SPA fallback answer missing files with index.html.
        if (!(res.headers.get("content-type") ?? "").includes("json")) return {};
        return res.json() as Promise<CountryCityIndex>;
      })
      .catch((err) => {
        cityFileCache.delete(cc); // allow retry on next call
        throw err;
      });
    cityFileCache.set(cc, p);
  }
  return p;
};

export const loadCitiesOfState = async (countryCode: string, stateCode: string): Promise<CityItem[]> => {
  const index = await loadCountryCities(countryCode);
  return (index[stateCode] ?? []).map((name) => ({ name, countryCode, stateCode }));
};
