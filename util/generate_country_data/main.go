package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/pariz/gountries"
)

type countryData struct {
	gountries.Coordinates
	Name string
}

var countryBlacklist = map[string]struct{}{
	"PF": {},
}

func main() {
	query := gountries.New()
	allCountries := query.FindAllCountries()

	allCountryCodes := []string{}
	data := map[string]countryData{}
	for _, c := range allCountries {
		if _, ok := countryBlacklist[c.Alpha2]; ok {
			continue
		}

		allCountryCodes = append(allCountryCodes, c.Alpha2)
		data[c.Alpha2] = countryData{
			Name:        c.Name.Common,
			Coordinates: c.Coordinates,
		}
	}

	rand.Seed(time.Now().Unix())
	rand.Shuffle(len(allCountryCodes), func(i, j int) {
		allCountryCodes[i], allCountryCodes[j] = allCountryCodes[j], allCountryCodes[i]
	})

	countriesF, err := os.Create("./data/countries.json")
	if err != nil {
		panic(err)
	}
	defer countriesF.Close()

	enc := json.NewEncoder(countriesF)
	enc.SetIndent("", "  ")
	err = enc.Encode(data)
	if err != nil {
		panic(err)
	}

	countryListF, err := os.Create("./data/countryList.json")
	if err != nil {
		panic(err)
	}
	defer countryListF.Close()

	enc = json.NewEncoder(countryListF)
	enc.SetIndent("", "  ")
	err = enc.Encode(allCountryCodes)
	if err != nil {
		panic(err)
	}

	log.Printf("Done")
}
