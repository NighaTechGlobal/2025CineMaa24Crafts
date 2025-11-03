/**
 * Time utilities for handling IST (Indian Standard Time) timezone
 */

/**
 * Get current time in IST
 * Returns ISO string with IST timezone offset
 */
export function getCurrentIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString();
}

/**
 * Get current time in IST for comparison
 * Returns ISO string that can be used for Supabase queries
 */
export function getCurrentISTForComparison(): string {
  return getCurrentIST();
}

/**
 * Get OTP expiration time in IST (10 minutes from now)
 * Returns ISO string for storing in database
 */
export function getOTPExpirationIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const expirationTime = 10 * 60 * 1000; // 10 minutes in milliseconds
  const istExpiry = new Date(now.getTime() + istOffset + expirationTime);
  return istExpiry.toISOString();
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
    const istOffset = 5.5 * 60 * 60 * 1000;
    const expirationTime = minutes * 60 * 1000;
    const istExpiry = new Date(now.getTime() + istOffset + expirationTime);
    return istExpiry.toISOString();
  },
  fromDate: (date: Date): string => {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(date.getTime() + istOffset);
    return istTime.toISOString();
  },
};

