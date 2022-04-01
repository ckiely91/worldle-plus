const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const pathToCountryList = path.join(__dirname, "../data/countryList.json");
const countryList = require(pathToCountryList);

const shuffled = _.shuffle(countryList);

fs.writeFileSync(pathToCountryList, JSON.stringify(shuffled, null, 2));

console.log("Shuffled country list");
