import rawAnswerData from '../data/country_data.json';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
dayjs.extend(advancedFormat);

const key: string | undefined = import.meta.env.VITE_CRYPTO_KEY;

export function decrypt(encryptedAnsKey: string | undefined) {
  if (!encryptedAnsKey) throw new Error('No encrypted answer provided');
  if (!key) throw new Error('Missing VITE_CRYPTO_KEY at build time');
  const bytes = AES.decrypt(encryptedAnsKey, key);
  const originalText = bytes.toString(Utf8);
  const answerKey = parseInt(originalText);
  if (Number.isNaN(answerKey)) throw new Error('Invalid decrypted answer');
  const answer = rawAnswerData['features'][answerKey] as Country;
  return answer;
}

export const getDayCode = () => dayjs().endOf('day').format('X');

export async function getAnswer() {
  const today = dayjs().format('YYYY-MM-DD');
  const listLength = rawAnswerData['features'].length;
  // const endpoint = `/.netlify/functions/answer?day=${today}`;
  const endpoint = `/answer?day=${today}&list=${listLength}`;
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`Server error (${response.status})`);
    const data = (await response.json()) as { answer?: string };
    if (!data?.answer) throw new Error('No answer in server response');
    const answer = decrypt(data.answer);
    return answer;
  } catch (e) {
    console.error('Failed to fetch or decrypt answer:', e);
    return undefined;
  }
}
