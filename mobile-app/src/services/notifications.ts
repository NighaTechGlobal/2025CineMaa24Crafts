import { logger } from '../utils/logger';
import { revokePushToken, getMyDevices } from './api';

export type RegisterOptions = {
  onNavigateFromNotification?: (route?: string, id?: string) => void;
};

export async function initializeNotificationHandlers() {
  // No-op: notifications are disabled for Expo SDK 54 web/Go.
  // Leaving this stub to avoid breaking imports; safe to call.
  logger.info('Notifications disabled: initializeNotificationHandlers noop');
}

export async function registerDeviceForPushNotifications(_opts?: RegisterOptions) {
  // No-op: push registration disabled. Return a consistent shape.
  logger.info('Notifications disabled: registerDeviceForPushNotifications noop');
  return { registered: false } as const;
}

export async function revokeCurrentToken(token: string) {
  try {
    await revokePushToken({ token });
  } catch (e) {
    logger.error('Revoke token error', e);
  }
}

export async function listMyDevices() {
  try {
    return await getMyDevices();
  } catch (e) {
    logger.error('List devices error', e);
    return [];
  }
}