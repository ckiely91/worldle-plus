import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import {
  CountryMetadata,
  getCountryMetadata,
  getTodaysCountry,
} from "../funcs/countries";
import { Fragment, useEffect, useState } from "react";
import Select from "react-select";
import { getStoredData, Guess, setStoredData } from "../funcs/storage";
import { Layer, Map, Source } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface IHomeProps {
  targetCountry: string;
  worldleNumber: number;
  countryMetadata: CountryMetadata;
}

const numGuessesAllowed = 6;
const earthAntipodalDistance = 20000;

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const mapStylesNoCountries =
  "mapbox://styles/ckiely91/cl1legsxf000716o09f0weaf6";
const mapStylesWithCountries =
  "mapbox://styles/ckiely91/cl1lixt8i000c16o0bilin9z7";

const Home: NextPage<IHomeProps> = ({
  targetCountry,
  worldleNumber,
  countryMetadata: {
    countriesAndDistances,
    countryName,
    isoCode,
    latitude,
    longitude,
    minLatitude,
    maxLatitude,
    minLongitude,
    maxLongitude,
  },
}) => {
  const [guesses, setGuesses] = useState<(Guess | null)[]>(() =>
    new Array(numGuessesAllowed).fill(null)
  );

  useEffect(() => {
    // See if we have any data in local storage when we first mount
    const storedData = getStoredData();
    if (storedData && storedData.targetCountry === targetCountry) {
      setGuesses(storedData.guesses);
    }
  }, [targetCountry]);

  let numGuesses = guesses.findIndex((g) => g === null);
  if (numGuesses === -1) {
    numGuesses = numGuessesAllowed;
  }

  const correct = !!guesses.find((g) => g?.correct);
  const completed = correct || numGuesses === numGuessesAllowed;

  const makeGuess = (countryCode: string) => {
    const country = countriesAndDistances.find(
      (c) => c.countryCode === countryCode
    );
    if (!country) {
      throw new Error("made guess not in country list");
    }

    const newGuesses = [...guesses];
    newGuesses[numGuesses] = {
      country: country.countryName,
      distanceKm: country.distanceKm,
      bearingDeg: country.bearingDeg,
      correct: countryCode === targetCountry,
    };

    setGuesses(newGuesses);

    // Update local storage
    setStoredData({
      targetCountry,
      guesses: newGuesses,
    });
  };

  const onShare = () => {
    const shareText = getShareText(worldleNumber, numGuesses, correct, guesses);
    if (typeof navigator.share === "function") {
      navigator.share({
        text: shareText,
      });
    } else if (typeof navigator.clipboard === "object") {
      navigator.clipboard.writeText(shareText);
    }
  };

  const options = [];
  for (let i = 0; i < countriesAndDistances.length; i++) {
    const { countryName, countryCode } = countriesAndDistances[i];

    if (!guesses.find((g) => g?.country === countryName)) {
      options.push({
        value: countryCode,
        label: countryName,
        countryCode: countryCode,
      });
    }
  }

  const countryHighlight = (
    <Source type="vector" url="mapbox://mapbox.country-boundaries-v1">
      <Layer
        id="country-boundaries"
        type="fill"
        source-layer="country_boundaries"
        paint={{
          "fill-color": "#d2361e",
          "fill-opacity": 0.4,
        }}
        filter={["in", "iso_3166_1", isoCode]}
      />
    </Source>
  );

  return (
    <>
      <Head>
        <title>Worldle+</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex justify-center flex-auto dark:bg-slate-900 dark:text-slate-50">
        <div className="w-full max-w-lg flex flex-col">
          <header className="flex px-3 border-b-2 border-gray-200 mb-2">
            <h1 className="text-4xl font-bold uppercase tracking-wide text-center my-1 flex-auto">
              Worldle+
            </h1>
          </header>
          <div className="flex flex-grow flex-col">
            <div style={{ height: "300px", position: "relative" }}>
              <div
                className={`absolute z-0 top-0 left-0 right-0 bottom-0 ${
                  !completed ? "invisible" : ""
                }`}
              >
                <Map
                  style={{ width: "100%", height: 300 }}
                  initialViewState={{
                    bounds: [
                      maxLongitude, // west
                      maxLatitude, // south
                      minLongitude, // east
                      minLatitude, // north
                    ],
                    fitBoundsOptions: {
                      padding: 30,
                    },
                  }}
                  interactive
                  attributionControl={false}
                  mapStyle={mapStylesWithCountries}
                  mapboxAccessToken={MAPBOX_TOKEN}
                >
                  {countryHighlight}
                </Map>
              </div>
              <div
                className={`absolute z-0 top-0 left-0 right-0 bottom-0 ${
                  completed ? "invisible" : ""
                }`}
              >
                <Map
                  style={{ width: "100%", height: 300 }}
                  initialViewState={{
                    bounds: [
                      maxLongitude, // west
                      maxLatitude, // south
                      minLongitude, // east
                      minLatitude, // north
                    ],
                    fitBoundsOptions: {
                      padding: 30,
                    },
                  }}
                  interactive={false}
                  attributionControl={false}
                  mapStyle={mapStylesNoCountries}
                  mapboxAccessToken={MAPBOX_TOKEN}
                >
                  {countryHighlight}
                </Map>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center my-2">
              {guesses.map((g, i) =>
                g ? (
                  <Fragment key={i}>
                    <div className="col-span-3 h-8 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                      {g.country}
                    </div>
                    <div className="col-span-2 h-8 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                      {g.distanceKm}km
                    </div>
                    <div className="col-span-1 h-8 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                      {!g.correct && getBearingDir(g.bearingDeg)[1]}
                    </div>
                    <div className="col-span-1 h-8 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                      {g.correct ? "🎉" : <>{getDistPct(g.distanceKm)}%</>}
                    </div>
                  </Fragment>
                ) : (
                  <div
                    key={i}
                    className="col-span-7 h-8 bg-gray-200 dark:bg-slate-600"
                  />
                )
              )}
            </div>
            {completed ? (
              <div className="grid grid-cols-3 gap-1">
                <div className="col-span-2 h-10 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                  <div className="w-7 mr-2">
                    <img
                      className="w-7"
                      src={`https://flagcdn.com/${isoCode.toLowerCase()}.svg`}
                    />
                  </div>
                  {countryName}
                </div>
                <div
                  onClick={onShare}
                  className="col-span-1 h-10 bg-blue-300 dark:bg-blue-900 flex items-center justify-center rounded cursor-pointer"
                >
                  Share
                </div>
              </div>
            ) : (
              <Select
                instanceId="country_select"
                className="country-select-container"
                classNamePrefix="country-select"
                options={options}
                onChange={(newValue) => makeGuess(newValue?.value || "")}
                isDisabled={completed}
                controlShouldRenderValue={false}
                isSearchable
                placeholder="Start typing a country name..."
                menuPlacement="top"
                openMenuOnClick={false}
                formatOptionLabel={(opt) => {
                  return (
                    <>
                      <div className="w-5 mr-2">
                        {opt.countryCode && (
                          <img
                            className="w-5"
                            src={`https://flagcdn.com/${opt.countryCode.toLowerCase()}.svg`}
                          />
                        )}
                      </div>
                      {opt.label}
                    </>
                  );
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const getShareText = (
  worldleNumber: number,
  numGuesses: number,
  correct: boolean,
  guesses: (Guess | null)[]
): string => {
  let firstLine = `#Worldle+ #${worldleNumber} ${
    correct ? numGuesses : "X"
  }/${numGuessesAllowed}`;
  let str = "";

  let highestPct = 0;
  for (let i = 0; i < guesses.length; i++) {
    const guess = guesses[i];
    if (!guess) {
      break;
    }

    str += "\n";
    const dist = getDistPct(guess.distanceKm);
    if (dist > highestPct) {
      highestPct = dist;
    }

    const numGreens = Math.floor(dist / 20);
    const numYellows = dist > 90 && dist < 100 ? 1 : 0;
    const numGreys = 5 - numGreens - numYellows;

    for (let j = 0; j < numGreens; j++) {
      str += "🟩";
    }

    for (let j = 0; j < numYellows; j++) {
      str += "🟨";
    }

    for (let j = 0; j < numGreys; j++) {
      str += "⬜";
    }

    if (guess.correct) {
      str += "🎉";
    } else {
      str += getBearingDir(guess.bearingDeg)[0];
    }
  }

  if (!correct) {
    firstLine += ` ${highestPct}%`;
  }
  str = firstLine + str;
  str += "\nhttps://worldle.acrofever.com";

  return str;
};

const getBearingDir = (bearing: number): [string, string] => {
  if (bearing < 22.5) {
    return ["⬆️", "↑"];
  } else if (bearing < 67.5) {
    return ["↗️", "↗"];
  } else if (bearing < 112.5) {
    return ["➡️", "→"];
  } else if (bearing < 157.5) {
    return ["↘️", "↘"];
  } else if (bearing < 202.5) {
    return ["⬇️️", "↓"];
  } else if (bearing < 247.5) {
    return ["↙️", "↙"];
  } else if (bearing < 292.5) {
    return ["⬅️", "←"];
  } else if (bearing < 337.5) {
    return ["↖️", "↖"];
  } else {
    return ["⬆️", "↑"];
  }
};

const getDistPct = (distanceKm: number) => {
  return Math.floor((1 - distanceKm / earthAntipodalDistance) * 100);
};

export const getStaticProps: GetStaticProps<IHomeProps> = async (context) => {
  const [targetCountry, worldleNumber] = getTodaysCountry();
  const countryMetadata = getCountryMetadata(targetCountry);

  return {
    props: {
      targetCountry,
      worldleNumber,
      countryMetadata,
    },
    revalidate: 3600, // Regenerate site every hour
  };
};

export default Home;
