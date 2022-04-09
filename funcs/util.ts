import seedrandom from "seedrandom";

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

export function calculateBearing(
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

export function getRandomSample<T>(
  inVals: T[],
  sampleSize: number,
  randomSeed: string
): T[] {
  const vals = [...inVals];
  const rng = seedrandom(randomSeed);
  const sample: T[] = [];

  while (sample.length < sampleSize) {
    const [sampledVal] = vals.splice(Math.floor(rng() * vals.length), 1);
    sample.push(sampledVal);
  }

  return sample;
}
