export function stripQuestionNumberPrefix(question: string) {
  return question.replace(/^\s*\p{Decimal_Number}+\.\s*/u, '');
}
