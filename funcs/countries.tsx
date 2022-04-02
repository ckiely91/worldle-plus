import countriesTopojsonJSON from "../data/countries-10m-map-units.json";
import { geoEquirectangular, geoPath, geoDistance } from "d3-geo";
import {
  feature as getFeatures,
  neighbors as getNeighbors,
} from "topojson-client";
import { GeometryCollection, Topology } from "topojson-specification";
import { renderToStaticMarkup } from "react-dom/server";
import countryList from "../data/countryList.json";
import { DateTime, Interval } from "luxon";
import { Feature } from "geojson";
import { optimize, OptimizedSvg } from "svgo";

const countriesTopojson = countriesTopojsonJSON as unknown as Topology<{
  countries: GeometryCollection<{
    NAME_EN: string;
    ISO_A2: string;
  }>;
}>;

const geographies = getFeatures(
  countriesTopojson,
  countriesTopojson.objects.countries
).features;

const neighbors = getNeighbors(countriesTopojson.objects.countries.geometries);

// Scale out the view box 20% of the country's area.
const countryScalingFactor = 0.2;

const earthRadiusKm = 6371;

interface countryAndDistance {
  countryName: string;
  countryCode: string;
  distanceKm: number;
  bearingDeg: number;
}

export interface CountryMetadata {
  countrySVG: string;
  countriesAndDistances: countryAndDistance[];
}

export const getCountryMetadata = (countryName: string): CountryMetadata => {
  // Get the specified country and its neighbours
  let country: Feature | undefined;
  let thisCountryNeighborIndexes;
  for (let i = 0; i < geographies.length; i++) {
    const { NAME_EN: name } = geographies[i].properties;
    if (name === countryName) {
      country = geographies[i];
      thisCountryNeighborIndexes = neighbors[i];
      break;
    }
  }

  if (!country || !thisCountryNeighborIndexes) {
    throw new Error(`Country ${countryName} not found`);
  }

  const thisCountryNeighbors = thisCountryNeighborIndexes.map(
    (i) => geographies[i]
  );

  const projection = geoEquirectangular();
  if (!projection.invert) {
    throw new Error("No invert function on this projection");
  }

  const pathGenerator = geoPath().projection(projection);

  const countryBounds = pathGenerator.bounds(country);
  const minX = countryBounds[0][0];
  const width = countryBounds[1][0] - minX;
  const minY = countryBounds[0][1];
  const height = countryBounds[1][1] - minY;

  const countryCentroid = pathGenerator.centroid(country);
  const countryLatLong = projection.invert(countryCentroid);

  if (!countryLatLong) {
    throw new Error("Could not get lat/long");
  }

  const viewBoxMinX = minX - width * 0.5 * countryScalingFactor;
  const viewBoxMinY = minY - height * 0.5 * countryScalingFactor;
  const viewBoxWidth = width + width * countryScalingFactor;
  const viewBoxHeight = height + height * countryScalingFactor;

  const countrySVG = (
    <svg
      className="country-svg"
      viewBox={`${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`}
      width="100%"
      height="300"
    >
      {geographies.map((c) => (
        <path
          key={c.properties.ISO_A2}
          id={`country_${c.properties.ISO_A2}`}
          className={
            c.properties.ISO_A2 === country?.properties?.ISO_A2
              ? "main-country"
              : "neighbour"
          }
          vectorEffect="non-scaling-stroke"
          d={pathGenerator(c) || undefined}
        />
      ))}
    </svg>
  );

  const countrySVGStr = optimize(renderToStaticMarkup(countrySVG), {
    plugins: ["removeOffCanvasPaths", "preset-default"],
  });

  // Now - for each country in the world, calculate its distance to our
  // specified country.
  const countriesAndDistances: countryAndDistance[] = geographies.map(
    (thisCountry) => {
      const thisCountryLatLong =
        projection.invert &&
        projection.invert(pathGenerator.centroid(thisCountry));
      if (!thisCountryLatLong) {
        throw new Error("Could not get lat/long");
      }

      const distanceInRadians = geoDistance(thisCountryLatLong, countryLatLong);
      const distanceKm = earthRadiusKm * distanceInRadians;

      const bearingDeg = calculateBearing(
        thisCountryLatLong[1],
        thisCountryLatLong[0],
        countryLatLong[1],
        countryLatLong[0]
      );

      return {
        countryName: thisCountry.properties.NAME_EN,
        countryCode:
          thisCountry.properties.ISO_A2 !== "-99"
            ? thisCountry.properties.ISO_A2
            : "",
        distanceKm: Math.round(distanceKm),
        bearingDeg: Math.round(bearingDeg),
      };
    }
  );

  countriesAndDistances.sort((a, b) =>
    a.countryName.localeCompare(b.countryName)
  );

  return {
    countrySVG: (countrySVGStr as OptimizedSvg).data,
    countriesAndDistances,
  };
};

export const getTodaysCountry = (): [string, number] => {
  const interval = Interval.fromDateTimes(
    DateTime.fromISO("2022-03-31T16:00:00.000Z"),
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
