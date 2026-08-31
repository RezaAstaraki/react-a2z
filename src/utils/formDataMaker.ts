export function formDataMaker(
  obj: Record<string, any>,
  formData = new FormData(),
  parentKey = '',
): FormData {
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const formKey = parentKey ? `${parentKey}[${key}]` : key;

    if (value instanceof Date) {
      formData.append(formKey, value.toISOString());
    } else if (value instanceof File) {
      formData.append(formKey, value);
    } else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      // Recursively handle nested objects
      formDataMaker(value, formData, formKey);
    } else if (Array.isArray(value)) {
      // For arrays, append each item with its index
      value.forEach((item, index) => {
        const arrayKey = `${formKey}[${index}]`;
        if (typeof item === 'object' && !Array.isArray(item)) {
          // Recursively handle nested objects within arrays
          formDataMaker(item, formData, arrayKey);
        } else {
          formData.append(arrayKey, item);
        }
      });
    } else if (value !== undefined) {
      formData.append(formKey, value);
    }
  });

  return formData;
}
