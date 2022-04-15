import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import {
  CountryMetadata,
  getCountryMetadata,
  getTodaysCountry,
} from "../funcs/countries";
import { FC, Fragment, useEffect, useState } from "react";
import Select from "react-select";
import {
  getTodaysData,
  Guess,
  setTodaysData,
  updateStatsData,
} from "../funcs/storage";
import { Layer, LngLatBoundsLike, Map, Source } from "react-map-gl";
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

interface IWorldleMap {
  mapStyle: string;
  interactive: boolean;
  bounds: LngLatBoundsLike;
  isoCode: string;
}

const WorldleMap: FC<IWorldleMap> = ({
  mapStyle,
  interactive,
  bounds,
  isoCode,
}) => (
  <Map
    style={{ width: "100%", height: 300 }}
    initialViewState={{
      bounds,
      fitBoundsOptions: {
        padding: 30,
      },
    }}
    interactive={interactive}
    attributionControl={false}
    mapStyle={mapStyle}
    mapboxAccessToken={MAPBOX_TOKEN}
  >
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
  </Map>
);

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
    countriesForFlags,
  },
}) => {
  const [guesses, setGuesses] = useState<(Guess | null)[]>(() =>
    new Array(numGuessesAllowed).fill(null)
  );
  const [bonusGuess, setBonusGuess] = useState<string | undefined>(undefined);

  useEffect(() => {
    // See if we have any data in local storage when we first mount
    const storedData = getTodaysData();
    if (storedData && storedData.targetCountry === targetCountry) {
      setGuesses(storedData.guesses);
      setBonusGuess(storedData.bonusGuess);
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
    setTodaysData({
      targetCountry,
      guesses: newGuesses,
    });
  };

  const makeBonusGuess = (guessedCountryCode: string) => {
    setBonusGuess(guessedCountryCode);
    // Update local storage
    setTodaysData({
      targetCountry,
      guesses: guesses,
      bonusGuess: guessedCountryCode,
    });
    updateStatsData(correct, numGuesses, guessedCountryCode === isoCode);
  };

  const onShare = () => {
    const shareText = getShareText(
      worldleNumber,
      numGuesses,
      correct,
      bonusGuess === isoCode,
      guesses
    );
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

  return (
    <>
      <div style={{ height: "300px", position: "relative" }}>
        <div
          className={`absolute z-0 top-0 left-0 right-0 bottom-0 ${
            !completed ? "invisible" : ""
          }`}
        >
          <WorldleMap
            mapStyle={mapStylesWithCountries}
            interactive={true}
            bounds={[
              maxLongitude, // west
              maxLatitude, // south
              minLongitude, // east
              minLatitude, // north
            ]}
            isoCode={isoCode}
          />
        </div>
        <div
          className={`absolute z-0 top-0 left-0 right-0 bottom-0 ${
            completed ? "invisible" : ""
          }`}
        >
          <WorldleMap
            mapStyle={mapStylesNoCountries}
            interactive={false}
            bounds={[
              maxLongitude, // west
              maxLatitude, // south
              minLongitude, // east
              minLatitude, // north
            ]}
            isoCode={isoCode}
          />
        </div>
      </div>
      {completed && bonusGuess === undefined ? (
        <div className="mt-3 mx-1 flex flex-col items-center">
          <h1 className="text-2xl font-bold">Bonus round</h1>
          <h2 className="text-xl mt-1">
            Select the correct flag for <strong>{countryName}</strong>
          </h2>
          <div className="grid grid-cols-2 gap-5 mt-3 self-stretch">
            {countriesForFlags.map((c) => (
              <div
                key={c}
                onClick={() => makeBonusGuess(c)}
                className="h-44 bg-center bg-contain bg-no-repeat"
                style={{
                  backgroundImage: `url(https://flagcdn.com/${c.toLowerCase()}.svg)`,
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center my-2 mx-1">
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
            {completed && (
              <>
                <div className="col-span-5 h-8 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                  Bonus round: Flag selected
                </div>
                <div className="col-span-1 h-8 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                  {bonusGuess && (
                    <img
                      className="h-7"
                      src={`https://flagcdn.com/${bonusGuess.toLowerCase()}.svg`}
                    />
                  )}
                </div>
                <div className="col-span-1 h-8 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                  {bonusGuess === isoCode ? "✅" : "❌"}
                </div>
              </>
            )}
          </div>
          <div className="mx-1">
            {completed ? (
              <div className="grid grid-cols-7 gap-1">
                <div className="col-span-1 h-10 bg-gray-100 dark:bg-slate-700 px-1 flex items-center justify-center">
                  <img
                    className="h-9"
                    src={`https://flagcdn.com/${isoCode.toLowerCase()}.svg`}
                  />
                </div>
                <div className="col-span-4 h-10 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                  {countryName}
                </div>
                <div
                  onClick={onShare}
                  className="col-span-2 h-10 bg-blue-300 dark:bg-blue-900 flex items-center justify-center rounded cursor-pointer"
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
              />
            )}
          </div>
        </>
      )}
    </>
  );
};

const getShareText = (
  worldleNumber: number,
  numGuesses: number,
  correct: boolean,
  bonusRoundCorrect: boolean,
  guesses: (Guess | null)[]
): string => {
  let firstLine = `#Worldle+ #${worldleNumber} ${correct ? numGuesses : "X"}${
    bonusRoundCorrect ? "+" : ""
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
  str += `\nBonus round: ${bonusRoundCorrect ? "✅" : "❌"}`;
  str += "\n\nhttps://worldle.acrofever.com";

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
  const countryMetadata = getCountryMetadata(targetCountry, worldleNumber);

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
