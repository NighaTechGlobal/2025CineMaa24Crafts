export function safeDate(value: any, fallback: string = 'Not set'): string {
  if (!value) return fallback;
  const d = new Date(value);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString();
}