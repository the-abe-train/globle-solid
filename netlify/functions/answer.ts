import { Handler } from "@netlify/functions";
import rawAnswerData from "../../src/data/country_data.json";
import crypto from "crypto-js";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
dayjs.extend(advancedFormat);
dayjs.extend(timezone);
dayjs.extend(utc);

function encrypt(text: string) {
  const key = process.env.CRYPTO_KEY || "";
  const encyptedText = crypto.AES.encrypt(text, key).toString();
  return encyptedText;
}

function generateKey(list: any[], dayCode: number) {
  const SHUFFLE_KEY = process.env.SHUFFLE_KEY || "1";
  const key = Math.floor(dayCode / parseInt(SHUFFLE_KEY)) % list.length;
  return key;
}

const handler: Handler = async (event) => {
  try {
    const today = event.queryStringParameters?.day || "";
    console.log(event.queryStringParameters);
    const dayCode = parseInt(dayjs.tz(today, "Etc/UTC").format("X"));
    if (!dayCode) throw "Parameter error";
    console.log(dayCode);
    const countries = rawAnswerData["features"] as unknown as Country[];
    const key = generateKey(countries, dayCode);
    const country = countries[key];
    console.log("country", country.properties.NAME);
    const answer = encrypt(JSON.stringify(country));
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Mystery country retrieved.",
        answer,
      }),
    };
  } catch (error) {
    console.error(error);
    const message = "Internal server error";
    return {
      statusCode: 500,
      body: JSON.stringify({
        message,
        error,
      }),
    };
  }
};

export { handler };
