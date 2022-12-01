declare global {
  type Continent =
    | "Asia"
    | "Europe"
    | "Africa"
    | "North America"
    | "South America"
    | "Oceania"
    | "None";

  type Unit = "km" | "miles";

  type City = {
    id: number;
    city: string;
    city_ascii: string;
    lat: number;
    lng: number;
    country: string;
    iso2: string;
    iso3: string;
    admin_name: string;
    capital: "admin" | "primary" | "minor" | null;
    population: number;
    is_territory: boolean;
    continent: Continent;
    guessable: boolean;
    rank: number;
  };

  type Coords = {
    lat: number;
    lng: number;
  };

  type Cartesian = {
    x: number;
    y: number;
    z: number;
  };

  type GuessStore = {
    cities: City[];
    readonly sortedGuesses: City[];
    readonly numGuesses: number;
    readonly closest: number;
  };

  type Stats = {
    gamesWon: number;
    lastWin: string;
    currentStreak: number;
    maxStreak: number;
    usedGuesses: number[];
    emojiGuesses: string;
  };

  type Prompt = "Choice" | "Message";

  type Token = {
    iss: string;
    nbf: number;
    aud: string;
    sub: string;
    email: string;
    email_verified: boolean;
    azp: string;
    name: string;
    picture: string;
    given_name: string;
    family_name: string;
    iat: number;
    exp: number;
    jti: string;
  };

  type Country = {
    type: string;
    proximity?: number;
    properties: {
      scalerank: number;
      featurecla: string;
      LABELRANK: number;
      SOVEREIGNT: string;
      SOV_A3: string; // function pickCountry(name: string) {
      //   const country = countries.find(c => {
      //     return c.properties.NAME === name;
      //   })
      //   return country;
      // }
      ADM0_DIF: //     return c.properties.NAME === name;
      //   })
      //   return country;
      // }
      number;
      LEVEL: number;
      TYPE: string;
      ADMIN: string; //     return c.properties.NAME === name;
      ADM0_A3: string;
      GEOU_DIF: number;
      GEOUNIT: string;
      GU_A3: string;
      SU_DIF: number;
      SUBUNIT: string;
      SU_A3: string;
      BRK_DIFF: number;
      NAME: string;
      NAME_LONG: string;
      BRK_A3: string;
      BRK_NAME: string;
      BRK_GROUP: null;
      ABBREV: string;
      POSTAL: string; // For both, West and South are negative
      FORMAL_EN: string | null;
      FORMAL_FR: string | null;
      NAME_CIAWF: string | null;
      NOTE_ADM0: string | null;
      NOTE_BRK: string | null;
      NAME_SORT: string;
      NAME_ALT: string | null;
      MAPCOLOR7: number;
      MAPCOLOR8: number;
      MAPCOLOR9: number;
      MAPCOLOR13: number;
      POP_EST: number;
      POP_RANK: number;
      GDP_MD_EST: number;
      POP_YEAR: number;
      LASTCENSUS: number;
      GDP_YEAR: number;
      ECONOMY: string;
      INCOME_GRP: string;
      WIKIPEDIA: number;
      FIPS_10_: string;
      ISO_A2: string;
      ISO_A2_EH: string;
      FLAG: string;
      ISO_A3: string;
      ISO_A3_EH: string;
      ISO_N3: string;
      UN_A3: string;
      WB_A2: string;
      WB_A3: string;
      WOE_ID: number;
      WOE_ID_EH: number;
      WOE_NOTE: string;
      ADM0_A3_IS: string;
      ADM0_A3_US: string;
      ADM0_A3_UN: number;
      ADM0_A3_WB: number;
      CONTINENT: string;
      REGION_UN: string;
      SUBREGION: string;
      REGION_WB: string;
      NAME_LEN: number;
      LONG_LEN: number;
      ABBREV_LEN: number;
      TINY: number;
      HOMEPART: number;
      MIN_ZOOM: number;
      MIN_LABEL: number;
      MAX_LABEL: number;
      NAME_AR: string;
      NAME_BN: string;
      NAME_DE: string;
      NAME_EN: string;
      NAME_ES: string;
      NAME_FA: string;
      NAME_FR: string;
      NAME_EL: string;
      NAME_HE: string;
      NAME_HI: string;
      NAME_HU: string;
      NAME_ID: string;
      NAME_IT: string;
      NAME_JA: string;
      NAME_KO: string;
      NAME_NL: string;
      NAME_PL: string;
      NAME_PT: string;
      NAME_RU: string;
      NAME_SV: string;
      NAME_TR: string;
      NAME_UK: string;
      NAME_UR: string;
      NAME_VI: string;
      NAME_ZH: string;
      NAME_ZHT: string;
    };
    bbox: number[];
    geometry:
      | {
          type: "Polygon";
          coordinates: number[][][];
        }
      | {
          type: "MultiPolygon";
          coordinates: number[][][][];
        };
  };
}

export {};
