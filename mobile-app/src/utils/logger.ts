/**
 * Logger utility for production-safe logging
 * - Debug logs only in development mode
 * - Errors are logged in production but without sensitive data
 * - Warnings and info are development-only by default
 */

const isDev = __DEV__;

export const logger = {
  /**
   * Debug logging - development only
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Debug logging - development only
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Info logging - development only
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Warning logging - development only
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Error logging - logs in production but filters sensitive data
   */
  error: (...args: any[]) => {
    if (isDev) {
      console.error(...args);
    } else {
      // In production, log errors but filter out sensitive information
      const sanitizedArgs = args.map(arg => {
        if (typeof arg === 'string') {
          // Remove potential sensitive data patterns
          return arg
            .replace(/token[=:]\s*[^\s,}]+/gi, 'token=***')
            .replace(/password[=:]\s*[^\s,}]+/gi, 'password=***')
            .replace(/secret[=:]\s*[^\s,}]+/gi, 'secret=***')
            .replace(/key[=:]\s*[^\s,}]+/gi, 'key=***')
            .replace(/auth[=:]\s*[^\s,}]+/gi, 'auth=***');
        }
        return arg;
      });
      console.error(...sanitizedArgs);
    }
  },

  /**
   * Production error logging - always logs, even in production
   * Use sparingly for critical errors that need to be tracked
   */
  prodError: (...args: any[]) => {
    const sanitizedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return arg
          .replace(/token[=:]\s*[^\s,}]+/gi, 'token=***')
          .replace(/password[=:]\s*[^\s,}]+/gi, 'password=***')
          .replace(/secret[=:]\s*[^\s,}]+/gi, 'secret=***')
          .replace(/key[=:]\s*[^\s,}]+/gi, 'key=***')
          .replace(/auth[=:]\s*[^\s,}]+/gi, 'auth=***');
      }
      return arg;
    });
    console.error(...sanitizedArgs);
  },
};

export default logger;

