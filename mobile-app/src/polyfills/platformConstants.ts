import { NativeModules, Platform } from 'react-native';

declare global {
  // eslint-disable-next-line no-var
  var RN$TurboInterop: boolean | undefined;
}

const globalInterop = globalThis as typeof globalThis & {
  RN$TurboInterop?: boolean;
};

// Ensure TurboModule registry can fall back to NativeModules in Expo Go bridgeless mode.
if (globalInterop.RN$TurboInterop !== true) {
  globalInterop.RN$TurboInterop = true;
}

type PlatformConstantsShape = {
  forceTouchAvailable?: boolean;
};

const defaultConstants: PlatformConstantsShape = {
  forceTouchAvailable: false,
};

const nativeConstants: PlatformConstantsShape =
  ((NativeModules as unknown as { PlatformConstants?: PlatformConstantsShape })?.PlatformConstants ??
    (Platform as unknown as { constants?: PlatformConstantsShape })?.constants ??
    defaultConstants);

const PlatformConstantsPolyfill: PlatformConstantsShape = {
  ...defaultConstants,
  ...nativeConstants,
};

(NativeModules as { PlatformConstants?: PlatformConstantsShape }).PlatformConstants = PlatformConstantsPolyfill;

// Stub out missing performance-related TurboModules so TurboModuleRegistry resolves them safely.
type PerformanceModule = {
  now: () => number;
};

type PerformanceObserverModule = {
  startReporting: () => void;
  stopReporting: () => void;
};

const ensureModule = <T>(key: string, value: T) => {
  if (!(NativeModules as Record<string, unknown>)[key]) {
    (NativeModules as Record<string, unknown>)[key] = value;
  }
};

ensureModule<PerformanceModule>('NativePerformanceCxx', {
  now: () => (globalThis.performance?.now?.() ?? Date.now()),
});

ensureModule<PerformanceObserverModule>('NativePerformanceObserverCxx', {
  startReporting: () => {},
  stopReporting: () => {},
});

export default PlatformConstantsPolyfill;
