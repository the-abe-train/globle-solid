declare global {
  type Unit = "km" | "miles";

  type Coords = {
    lat: number;
    lng: number;
  };

  type Cartesian = {
    x: number;
    y: number;
    z: number;
  };

  type Stats = {
    gamesWon: number;
    lastWin: string;
    currentStreak: number;
    maxStreak: number;
    usedGuesses: number[];
    emojiGuesses: string;
  };

  type DailyStats = {
    date: string;
    email: string;
    guesses: string[];
    answers: string;
    win: boolean;
  };

  type ModalPrompt = "Choice" | "Message";

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
      SOVEREIGNT?: string;
      ADMIN: string;
      GEOU_DIF: number;
      GEOUNIT: string;
      SUBUNIT: string;
      NAME: string;
      NAME_LONG: string;
      BRK_NAME: string;
      BRK_GROUP: null;
      ABBREV: string;
      POSTAL: string; // For both, West and South are negative
      FORMAL_EN: string | null;
      FORMAL_FR: string | null;
      NAME_SORT: string;
      NAME_ALT: string | null;
      ISO_A2: string;
      FLAG: string;
      WB_A2: string;
      WB_A3: string;
      WOE_NOTE: string;
      CONTINENT: string;
      REGION_UN: string;
      SUBREGION: string;
      REGION_WB: string;
      NAME_LEN: number;
      LONG_LEN: number;
      ABBREV_LEN: number;
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
      NAME_NO: string;
      NAME_LT: string;
      NAME_XH: string;
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

  type Territory = {
    properties: {
      SOVEREIGNT: string;
      ADMIN: string;
      TYPE: string;
      NAME: string;
      ABBREV: string;
      NAME_SORT: string;
    };
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
