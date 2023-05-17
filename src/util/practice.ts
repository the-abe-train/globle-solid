import rawAnswerData from "../../src/data/country_data.json";
import { getCountry } from "./data";

export function createPracticeAns() {
  const countries = rawAnswerData["features"] as Country[];
  const practiceAnswer =
    countries[Math.floor(Math.random() * countries.length)];
  // const practiceAnswer = getCountry("Italy");
  localStorage.setItem("practice", JSON.stringify(practiceAnswer));
  return practiceAnswer;
}

export function getPracticeAns() {
  const ansString = localStorage.getItem("practice");
  let ans: Country;
  if (ansString) {
    ans = JSON.parse(ansString);
  } else {
    ans = createPracticeAns();
  }
  return ans;
}
