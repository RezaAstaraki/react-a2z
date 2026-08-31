export function englishDigitsToPersian(input: string): string {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return input.replace(/[0-9]/g, (char) => {
    return persianNumbers[englishNumbers.indexOf(char)] ?? char;
  });
}
