const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const pathToAllData = path.join(__dirname, "../data/countries-10m-map-units.json");
const pathToCountryList = path.join(__dirname, "../data/countryList.json");
const allCountryData = require(pathToAllData);

const countryList =  allCountryData.objects.countries.geometries.map(g => g.properties.NAME_EN);

const shuffled = _.shuffle(countryList);

fs.writeFileSync(pathToCountryList, JSON.stringify(shuffled, null, 2));

console.log("Shuffled country list");
