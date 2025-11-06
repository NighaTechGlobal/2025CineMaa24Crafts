/**
 * Time utilities for handling IST (Indian Standard Time) timezone
 */

/**
 * Get current time for storage/comparison
 * Returns ISO string (UTC) suitable for Supabase timestamptz
 */
export function getCurrentIST(): string {
  const now = new Date();
  return now.toISOString();
}

/**
 * Get current time in IST for comparison
 * Returns ISO string that can be used for Supabase queries
 */
export function getCurrentISTForComparison(): string {
  return getCurrentIST();
}

/**
 * Get OTP expiration time (10 minutes from now)
 * Returns ISO string (UTC) for storing in database
 */
export function getOTPExpirationIST(): string {
  const now = new Date();
  const expirationTime = 10 * 60 * 1000; // 10 minutes in milliseconds
  const expiry = new Date(now.getTime() + expirationTime);
  return expiry.toISOString();
}

/**
 * Format date to IST string for display
 */
export function formatToIST(date: Date): string {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(date.getTime() + istOffset);
  return istTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

/**
 * Check if a date is expired (in IST)
 */
export function isExpired(expiryDate: Date | string): boolean {
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  return expiry < now;
}

/**
 * Helper object for common timestamp operations in IST
 */
export const ISTTimestamp = {
  now: (): string => getCurrentIST(),
  expiresIn: (minutes: number): string => {
    const now = new Date();
    const expirationTime = minutes * 60 * 1000;
    const expiry = new Date(now.getTime() + expirationTime);
    return expiry.toISOString();
  },
  fromDate: (date: Date): string => {
    return date.toISOString();
  },
};

