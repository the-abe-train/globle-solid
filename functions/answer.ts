import rawAnswerData from "../src/data/country_data.json";
import crypto from "crypto-js";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
dayjs.extend(advancedFormat);
dayjs.extend(timezone);
dayjs.extend(utc);

function encrypt(text: string, key: string) {
  const encyptedText = crypto.AES.encrypt(text, key).toString();
  return encyptedText;
}

function generateKey(list: any[], dayCode: number, shuffle: string) {
  const key = Math.floor(dayCode / parseInt(shuffle)) % list.length;
  return key;
}

type E = {
  SHUFFLE_KEY: string;
  CRYPTO_KEY: string;
};

const onRequest: PagesFunction<E> = async (context) => {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const today = url.searchParams.get("day");
    console.log({ today });
    const dayCode = parseInt(dayjs.tz(today, "Etc/UTC").format("X"));
    if (!dayCode) throw "Parameter error";
    console.log(dayCode);
    const countries = rawAnswerData["features"] as Country[];
    const key = generateKey(countries, dayCode, env.SHUFFLE_KEY);
    const country = countries[key];
    console.log("country", country.properties.NAME);
    const answer = encrypt(JSON.stringify(country), env.CRYPTO_KEY);
    return new Response(
      JSON.stringify({
        message: "Mystery country retrieved.",
        answer,
      })
    );
  } catch (error) {
    console.error(error);
    const message = "Internal server error";
    return new Response(
      JSON.stringify({
        message,
        error,
      })
    );
  }
};

export { onRequest };
