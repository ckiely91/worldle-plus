import { NextPage } from "next";
import { useEffect, useState } from "react";
import { getStatsData, setStatsData, StatsData } from "../funcs/storage";

const Stats: NextPage = () => {
  const [stats, setStats] = useState<StatsData>();
  useEffect(() => {
    setStats(getStatsData());
  }, []);

  if (!stats) {
    return null;
  }

  let maxTotalGuesses = 0;

  const totalCorrect = Object.entries(stats.guessDistribution).reduce(
    (prev: number, next) => {
      const [numGuesses, total] = next;
      if (total > maxTotalGuesses) {
        maxTotalGuesses = total;
      }

      if (numGuesses !== "X") {
        return prev + total;
      }
      return prev;
    },
    0
  );

  return (
    <>
      <div className="mt-3 mx-1 flex flex-col items-center">
        <h1 className="text-2xl font-bold">Stats</h1>
        <div className="mt-4 w-full grid grid-cols-5 justify-between">
          <div className="flex flex-col items-center">
            <div className="text-4xl">{stats.numCompleted}</div>
            <div>Played</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl">
              {stats.numCompleted === 0
                ? 0
                : Math.round((totalCorrect / stats.numCompleted) * 100)}
              %
            </div>
            <div>Win</div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl">
              {stats.numCompleted === 0
                ? 0
                : Math.round(
                    (stats.numBonusCorrect / stats.numCompleted) * 100
                  )}
              %
            </div>
            <div>
              Bonus
              <br />
              Correct
            </div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl">{stats.currentStreak}</div>
            <div>
              Current
              <br />
              Streak
            </div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl">{stats.maxStreak}</div>
            <div>
              Max
              <br />
              Streak
            </div>
          </div>
        </div>
        <h1 className="mt-8 text-2xl font-bold">Guess Distribution</h1>
        <div className="mt-4 w-full">
          {([1, 2, 3, 4, 5, 6, "X"] as (number | "X")[]).map((num) => (
            <div key={num} className="flex h-6 mt-2">
              <div className="w-5 mr-1 text-center bg-blue-300 text-blue-900">
                {num}
              </div>
              <div className="flex-grow">
                <div
                  className="bg-blue-50 text-blue-900 px-2"
                  style={{
                    minWidth: "26px",
                    width: `${
                      maxTotalGuesses === 0
                        ? 0
                        : Math.round(
                            (stats.guessDistribution[num] / maxTotalGuesses) *
                              100
                          )
                    }%`,
                  }}
                >
                  {stats.guessDistribution[num]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Stats;
