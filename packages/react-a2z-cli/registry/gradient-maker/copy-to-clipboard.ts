/**
 * Copy text to the clipboard.
 *
 * `navigator.clipboard` only exists in a secure context, so it is unavailable
 * on plain-http origins — including LAN/device testing. The temporary-textarea
 * fallback covers that case.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === 'undefined') {
    throw new Error('copyToClipboard: no document available');
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);

  const selection = document.getSelection();
  const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
    if (selection && previousRange) {
      selection.removeAllRanges();
      selection.addRange(previousRange);
    }
  }

  if (!copied) {
    throw new Error('copyToClipboard: execCommand("copy") returned false');
  }
}
