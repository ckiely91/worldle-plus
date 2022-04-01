import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import {
  CountryMetadata,
  getCountryMetadata,
  getTodaysCountry,
} from "../funcs/countries";
import { useState, Fragment } from "react";
import Select from "react-select";

interface guess {
  country: string;
  distanceKm: number;
  bearingDeg: number;
  correct: boolean;
}

interface IHomeProps {
  targetCountry: string;
  countryMetadata: CountryMetadata;
}

const numGuessesAllowed = 6;
const earthAntipodalDistance = 20000;

const Home: NextPage<IHomeProps> = ({
  targetCountry,
  countryMetadata: { countriesAndDistances, countrySVG },
}) => {
  const [guesses, setGuesses] = useState<(guess | null)[]>(
    new Array(numGuessesAllowed).fill(null)
  );

  let numGuesses = guesses.findIndex((g) => g === null);
  if (numGuesses === -1) {
    numGuesses = numGuessesAllowed;
  }

  const makeGuess = (countryName: string) => {
    const country = countriesAndDistances.find(
      (c) => c.country === countryName
    );
    if (!country) {
      throw new Error("made guess not in country list");
    }

    const newGuesses = [...guesses];
    newGuesses[numGuesses] = {
      country: countryName,
      distanceKm: country.distanceKm,
      bearingDeg: country.bearingDeg,
      correct: countryName === targetCountry,
    };

    setGuesses(newGuesses);
  };

  const options = [];
  for (let i = 0; i < countriesAndDistances.length; i++) {
    const { country } = countriesAndDistances[i];
    if (!guesses.find((g) => g?.country === country)) {
      options.push({
        value: country,
        label: country,
      });
    }
  }

  return (
    <>
      <Head>
        <title>Worldle+</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex justify-center flex-auto dark:bg-slate-900 dark:text-slate-900">
        <div className="w-full max-w-lg flex flex-col">
          <header className="flex px-3 border-b-2 border-gray-900">
            <h1 className="text-4xl font-bold uppercase tracking-wide text-center my-1 flex-auto">
              Worldle+
            </h1>
          </header>
          <div className="flex flex-grow flex-col">
            <div dangerouslySetInnerHTML={{ __html: countrySVG }} />
            <div className="grid grid-cols-7 gap-1 text-center my-2">
              {guesses.map((g, i) =>
                g ? (
                  <Fragment key={i}>
                    <div className="col-span-3 h-8">{g.country}</div>
                    <div className="col-span-2 h-8">{g.distanceKm}km</div>
                    <div className="col-span-1 h-8">
                      {getBearingDir(g.bearingDeg)}
                    </div>
                    <div className="col-span-1 h-8">
                      {g.correct ? (
                        "🎉"
                      ) : (
                        <>
                          {Math.floor(
                            (1 - g.distanceKm / earthAntipodalDistance) * 100
                          )}
                          %
                        </>
                      )}
                    </div>
                  </Fragment>
                ) : (
                  <div key={i} className="col-span-7 h-8 bg-gray-200" />
                )
              )}
            </div>
            <div>
              <Select
                instanceId="country-select"
                options={options}
                onChange={(newValue) => makeGuess(newValue?.value || "")}
                isDisabled={
                  numGuesses === numGuessesAllowed ||
                  !!guesses.find((g) => g?.correct)
                }
                controlShouldRenderValue={false}
                isSearchable
                placeholder="Start typing a country name..."
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const getBearingDir = (bearing: number): string => {
  if (bearing < 22.5) {
    return "⬆️";
  } else if (bearing < 67.5) {
    return "↗️";
  } else if (bearing < 112.5) {
    return "➡️";
  } else if (bearing < 157.5) {
    return "↘️";
  } else if (bearing < 202.5) {
    return "⬇️";
  } else if (bearing < 247.5) {
    return "↙️";
  } else if (bearing < 292.5) {
    return "⬅️";
  } else if (bearing < 337.5) {
    return "↖️";
  } else {
    return "⬆️";
  }
};

export const getStaticProps: GetStaticProps<IHomeProps> = async (context) => {
  const targetCountry = getTodaysCountry();
  const countryMetadata = getCountryMetadata(targetCountry);

  return {
    props: {
      targetCountry,
      countryMetadata,
    },
    revalidate: 3600, // Regenerate site every hour
  };
};

export default Home;
