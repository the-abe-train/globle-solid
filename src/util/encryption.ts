import rawAnswerData from "../data/country_data.json";
import crypto from "crypto-js";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
dayjs.extend(advancedFormat);

const key = import.meta.env.VITE_CRYPTO_KEY;

export function decrypt(encryptedAnsKey: string) {
  const bytes = crypto.AES.decrypt(encryptedAnsKey, key);
  const originalText = bytes.toString(crypto.enc.Utf8);
  const answerKey = parseInt(originalText);
  const answer = rawAnswerData["features"][answerKey] as Country;
  return answer;
}

export const getDayCode = () => dayjs().endOf("day").format("X");

export async function getAnswer() {
  const today = dayjs().format("YYYY-MM-DD");
  const listLength = rawAnswerData["features"].length;
  // const endpoint = `/.netlify/functions/answer?day=${today}`;
  const endpoint = `/answer?day=${today}&list=${listLength}`;
  try {
    const response = await fetch(endpoint);
    if (response.status !== 200) throw "Server error";
    const data = (await response.json()) as { answer: string };
    const encryptedAnswer = data.answer;
    const answer = decrypt(encryptedAnswer);
    return answer;
  } catch (e) {
    console.error(e);
  }
}
