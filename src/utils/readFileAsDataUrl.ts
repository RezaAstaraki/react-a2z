/**
 * Read a File as a base64 data URL (e.g. for embedding images in markdown).
 * Used by {@link MdEditor} when `onImageUpload` is omitted.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
