export function persianToEnglishDigits(input: string): string {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return input.replace(/[۰-۹]/g, (char) => {
    return englishNumbers[persianNumbers.indexOf(char)] ?? char;
  });
}
