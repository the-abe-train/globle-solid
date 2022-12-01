import crypto from "crypto-js";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { getPracticeAns } from "./practice";
dayjs.extend(advancedFormat);

const key = import.meta.env.VITE_CRYPTO_KEY;

export function decrypt(encryptedText: string) {
  const bytes = crypto.AES.decrypt(encryptedText, key);
  const originalText = bytes.toString(crypto.enc.Utf8);
  return originalText;
}

export const getDayCode = () => dayjs().endOf("day").format("X");

export async function getAnswer() {
  const today = dayjs().format("YYYY-MM-DD");
  const endpoint = `/.netlify/functions/answer?day=${today}`;
  try {
    const netlifyResponse = await fetch(endpoint);
    if (netlifyResponse.status !== 200) throw "Server error";
    const data = await netlifyResponse.json();
    const encryptedAnswer = data.answer;
    const answer = JSON.parse(decrypt(encryptedAnswer)) as Country;
    return answer;
  } catch (e) {
    console.error(e);
  }
}
