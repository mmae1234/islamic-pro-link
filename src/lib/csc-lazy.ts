/**
 * Lazy loaders for `country-state-city`.
 *
 * The full package ships ~8 MB of city data. Importing it eagerly at the top
 * of any file pulls all of that into the page's initial bundle. These helpers
 * load each dataset on-demand and cache the result for the rest of the
 * session.
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
export type CityApi = { getCitiesOfState: (countryCode: string, stateCode: string) => CityItem[] };

let countryPromise: Promise<CountryApi> | null = null;
let statePromise: Promise<StateApi> | null = null;
let cityPromise: Promise<CityApi> | null = null;

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

export const loadCity = (): Promise<CityApi> => {
  if (!cityPromise) {
    cityPromise = import("country-state-city/lib/city")
      .then((mod: any) => {
        const api = mod.default ?? mod;
        return { getCitiesOfState: (cc: string, sc: string) => api.getCitiesOfState(cc, sc) } as CityApi;
      })
      .catch((err) => {
        cityPromise = null;
        throw err;
      });
  }
  return cityPromise;
};
