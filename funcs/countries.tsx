import { geoDistance } from "d3-geo";
import countryList from "../data/countryList.json";
import { DateTime, Interval } from "luxon";
import countriesJSON from "../data/countries.json";
import { calculateBearing, getRandomSample } from "./util";
import shuffle from "lodash/shuffle";

const countries = countriesJSON as Record<
  string,
  {
    MinLongitude: number;
    MinLatitude: number;
    MaxLongitude: number;
    MaxLatitude: number;
    Latitude: number;
    Longitude: number;
    Name: string;
  }
>;

const earthRadiusKm = 6371;
const randomFlagCountries = 6;

interface countryAndDistance {
  countryName: string;
  countryCode: string;
  distanceKm: number;
  bearingDeg: number;
}

export interface CountryMetadata {
  countryName: string;
  isoCode: string;
  latitude: number;
  longitude: number;
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
  countriesAndDistances: countryAndDistance[];
  countriesForFlags: string[];
}

export const getCountryMetadata = (
  countryCode: string,
  randomSeed: number
): CountryMetadata => {
  const targetCountry = countries[countryCode];
  if (!targetCountry) {
    throw new Error("Target country not found");
  }

  // Get a random selection of countries to show flags for
  const allOtherCountryCodes = Object.keys(countries).filter(
    (c) => c !== countryCode
  );
  let countriesForFlags = getRandomSample(
    allOtherCountryCodes,
    randomFlagCountries - 1,
    randomSeed.toString()
  );

  // Add in the target country code and give it a shuffle
  countriesForFlags.push(countryCode);
  countriesForFlags = shuffle(countriesForFlags);

  const data: CountryMetadata = {
    countryName: targetCountry.Name,
    isoCode: countryCode,
    latitude: targetCountry.Latitude,
    longitude: targetCountry.Longitude,
    minLatitude: targetCountry.MinLatitude,
    maxLatitude: targetCountry.MaxLatitude,
    minLongitude: targetCountry.MinLongitude,
    maxLongitude: targetCountry.MaxLongitude,
    countriesForFlags,
    countriesAndDistances: [],
  };

  data.countriesAndDistances = Object.entries(countries).map(
    ([countryCode, meta]) => {
      const distanceInRadians = geoDistance(
        [meta.Longitude, meta.Latitude],
        [targetCountry.Longitude, targetCountry.Latitude]
      );
      const distanceKm = Math.round(earthRadiusKm * distanceInRadians);
      const bearingDeg = calculateBearing(
        meta.Latitude,
        meta.Longitude,
        targetCountry.Latitude,
        targetCountry.Longitude
      );

      return {
        countryName: meta.Name,
        countryCode,
        distanceKm,
        bearingDeg,
      };
    }
  );

  return data;
};

export const getTodaysCountry = (): [string, number] => {
  const interval = Interval.fromDateTimes(
    DateTime.fromISO("2022-04-04T16:00:00.000Z"),
    DateTime.now()
  );
  const numDays = Math.floor(interval.length("days"));

  return [countryList[numDays % countryList.length], numDays + 1];
};
