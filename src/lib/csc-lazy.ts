/**
 * Lazy loaders for `country-state-city`.
 *
 * The full package ships ~8 MB of city data. Importing it eagerly at the top
 * of any file pulls all of that into the page's initial bundle. These helpers
 * load each dataset on-demand and cache the result for the rest of the
 * session.
 *
 * Usage:
 *   const Country = await loadCountry();
 *   const all = Country.getAllCountries();
 */

type CountryModule = typeof import("country-state-city/lib/country");
type StateModule = typeof import("country-state-city/lib/state");
type CityModule = typeof import("country-state-city/lib/city");

let countryPromise: Promise<CountryModule> | null = null;
let statePromise: Promise<StateModule> | null = null;
let cityPromise: Promise<CityModule> | null = null;

export const loadCountry = (): Promise<CountryModule> => {
  if (!countryPromise) {
    countryPromise = import("country-state-city/lib/country");
  }
  return countryPromise;
};

export const loadState = (): Promise<StateModule> => {
  if (!statePromise) {
    statePromise = import("country-state-city/lib/state");
  }
  return statePromise;
};

export const loadCity = (): Promise<CityModule> => {
  if (!cityPromise) {
    cityPromise = import("country-state-city/lib/city");
  }
  return cityPromise;
};

export type CountryItem = { name: string; isoCode: string };
export type StateItem = { name: string; isoCode: string; countryCode: string };
export type CityItem = { name: string; countryCode: string; stateCode: string };
