import { persianToEnglishDigits } from './persianToEnglishDigits';

export function sanitizeNumericInput(raw: string): string {
  const normalized = persianToEnglishDigits(raw)
    .replace(/٫/g, '.')
    .replace(/[^\d.]/g, '');

  const [integerPart = '', ...fractionParts] = normalized.split('.');

  if (fractionParts.length === 0) return integerPart;

  return `${integerPart}.${fractionParts.join('')}`;
}
