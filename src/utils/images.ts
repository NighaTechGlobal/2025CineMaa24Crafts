export function isDataUri(value?: string): boolean {
  if (!value) return false;
  return /^data:image\//.test(value);
}

export function detectMimeFromBase64(value?: string): string {
  if (!value) return 'image/jpeg';
  const trimmed = value.trim();
  // Common magic numbers (base64 prefixes)
  if (trimmed.startsWith('iVBORw0KGgo')) return 'image/png'; // PNG
  if (trimmed.startsWith('/9j/')) return 'image/jpeg'; // JPEG
  if (trimmed.startsWith('R0lGOD')) return 'image/gif'; // GIF
  if (trimmed.startsWith('UklGR')) return 'image/webp'; // WEBP
  return 'image/jpeg';
}

/**
 * Normalize a base64 or data URI string into a valid React Native Image `uri`.
 * - If already a data URI, returns as-is.
 * - Else prefixes with detected mime type.
 */
export function asImageUri(base64OrUri?: string): string | undefined {
  if (!base64OrUri) return undefined;
  if (isDataUri(base64OrUri)) return base64OrUri;
  const mime = detectMimeFromBase64(base64OrUri);
  return `data:${mime};base64,${base64OrUri}`;
}