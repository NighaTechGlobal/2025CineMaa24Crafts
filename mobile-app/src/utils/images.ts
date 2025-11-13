import { Buffer } from 'buffer';

function detectMime(buf: Buffer): string {
  // JPEG: FF D8 FF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return 'image/png';
  }
  // GIF: 47 49 46
  if (buf.length >= 3 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return 'image/gif';
  }
  // WebP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return 'image/webp';
  }
  return 'image/jpeg';
}

function hexToBase64WithMime(hex: string): { b64: string; mime: string } {
  // Postgres bytea hex strings are prefixed with "\\x"
  const clean = hex.startsWith('\\x') ? hex.slice(2) : hex;
  const buf = Buffer.from(clean, 'hex');
  return { b64: buf.toString('base64'), mime: detectMime(buf) };
}

function tryDecodeBufferJsonBase64(b64: string): { b64: string; mime: string } | null {
  try {
    const decoded = Buffer.from(b64, 'base64').toString('utf-8');
    const obj = JSON.parse(decoded);
    if (obj && obj.type === 'Buffer' && Array.isArray(obj.data)) {
      const arr = Uint8Array.from(obj.data);
      const buf = Buffer.from(arr);
      return { b64: buf.toString('base64'), mime: detectMime(buf) };
    }
    return null;
  } catch {
    return null;
  }
}

export function asImageUri(input?: unknown | null): string | undefined {
  if (input === null || input === undefined) return undefined;

  // Handle Buffer JSON ({ type: 'Buffer', data: number[] })
  if (typeof input === 'object' && input) {
    const obj = input as any;
    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      const buf = Buffer.from(Uint8Array.from(obj.data));
      const mime = detectMime(buf);
      return `data:${mime};base64,${buf.toString('base64')}`;
    }
    // Handle Uint8Array or plain number[]
    if (obj instanceof Uint8Array) {
      const buf = Buffer.from(obj);
      const mime = detectMime(buf);
      return `data:${mime};base64,${buf.toString('base64')}`;
    }
    if (Array.isArray(obj)) {
      const buf = Buffer.from(Uint8Array.from(obj));
      const mime = detectMime(buf);
      return `data:${mime};base64,${buf.toString('base64')}`;
    }
    if (Array.isArray(obj.data)) {
      const buf = Buffer.from(Uint8Array.from(obj.data));
      const mime = detectMime(buf);
      return `data:${mime};base64,${buf.toString('base64')}`;
    }
  }

  const value = String(input).trim();
  if (!value || value.toLowerCase() === 'null' || value.toLowerCase() === 'undefined') {
    return undefined;
  }

  // Already a data URI
  if (value.startsWith('data:image')) return value;

  // Remote URL
  if (/^https?:\/\//i.test(value)) return value;

  // Supabase/Postgres bytea hex (e.g., "\\xFFD8...")
  if (/^\\x[0-9a-fA-F]+$/.test(value)) {
    const { b64, mime } = hexToBase64WithMime(value);
    return `data:${mime};base64,${b64}`;
  }

  // Base64 of JSON Buffer (e.g., eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6W10p)
  const decoded = tryDecodeBufferJsonBase64(value);
  if (decoded) {
    return `data:${decoded.mime};base64,${decoded.b64}`;
  }

  // Fallback: treat as raw base64 payload — sniff mime if possible
  try {
    const buf = Buffer.from(value, 'base64');
    const mime = detectMime(buf);
    return `data:${mime};base64,${value}`;
  } catch {
    return `data:image/jpeg;base64,${value}`;
  }
}

export function hasImage(input?: string | null): boolean {
  const uri = asImageUri(input);
  return typeof uri === 'string' && uri.length > 0;
}