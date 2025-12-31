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

async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        // Bypass service worker cache for this critical request
        cache: 'no-store',
        // Ensure credentials are included for same-origin
        credentials: 'same-origin',
      });
      return response;
    } catch (e) {
      const isLastAttempt = i === retries - 1;
      if (isLastAttempt) throw e;
      // Wait before retrying, with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Fetch failed after retries');
}

export async function getAnswer() {
  const today = dayjs().format('YYYY-MM-DD');
  const listLength = rawAnswerData['features'].length;
  // const endpoint = `/.netlify/functions/answer?day=${today}`;
  const endpoint = `/answer?day=${today}&list=${listLength}`;
  try {
    const response = await fetchWithRetry(endpoint);
    if (!response.ok) throw new Error(`Server error (${response.status})`);
    const data = (await response.json()) as { answer?: string };
    if (!data?.answer) throw new Error('No answer in server response');
    const answer = decrypt(data.answer);
    return answer;
  } catch (e) {
    // Provide more detailed error info for debugging
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    const errorType = e instanceof TypeError ? 'Network/CORS issue' : 'Server/decrypt issue';
    console.error(`Failed to fetch or decrypt answer (${errorType}):`, errorMessage);
    console.error(
      'If you see this error, try: 1) Disabling ad blockers, 2) Clearing browser cache, 3) Using a different browser',
    );
    return undefined;
  }
}
