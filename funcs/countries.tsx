import { geoDistance } from "d3-geo";
import countryList from "../data/countryList.json";
import { DateTime, Interval } from "luxon";
import countriesJSON from "../data/countries.json";

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
}

export const getCountryMetadata = (countryCode: string): CountryMetadata => {
  const targetCountry = countries[countryCode];
  if (!targetCountry) {
    throw new Error("Target country not found");
  }

  const data: CountryMetadata = {
    countryName: targetCountry.Name,
    isoCode: countryCode,
    latitude: targetCountry.Latitude,
    longitude: targetCountry.Longitude,
    minLatitude: targetCountry.MinLatitude,
    maxLatitude: targetCountry.MaxLatitude,
    minLongitude: targetCountry.MinLongitude,
    maxLongitude: targetCountry.MaxLongitude,
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

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

function calculateBearing(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
) {
  startLat = toRadians(startLat);
  startLng = toRadians(startLng);
  destLat = toRadians(destLat);
  destLng = toRadians(destLng);

  const y = Math.sin(destLng - startLng) * Math.cos(destLat);
  const x =
    Math.cos(startLat) * Math.sin(destLat) -
    Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
  let brng = Math.atan2(y, x);
  brng = toDegrees(brng);
  return (brng + 360) % 360;
}
