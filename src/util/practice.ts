import rawAnswerData from "../../src/data/country_data.json";

export function createPracticeAns() {
  const countries = rawAnswerData["features"] as Country[];
  const practiceAnswer =
    countries[Math.floor(Math.random() * countries.length)];
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
