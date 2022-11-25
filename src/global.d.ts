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
}

export {};
