import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export type HapticKind = 'light' | 'medium' | 'heavy';

let enabled = true;

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

/** Vibration courte. Native (Capacitor) sur iOS/Android, API Vibration dans le navigateur. */
export function vibrate(kind: HapticKind): void {
  if (!enabled) return;
  try {
    if (Capacitor.isNativePlatform()) {
      const style =
        kind === 'heavy'
          ? ImpactStyle.Heavy
          : kind === 'medium'
            ? ImpactStyle.Medium
            : ImpactStyle.Light;
      void Haptics.impact({ style });
    } else if ('vibrate' in navigator) {
      navigator.vibrate(kind === 'heavy' ? 80 : kind === 'medium' ? 35 : 12);
    }
  } catch {
    // Pas de vibration disponible : ce n'est pas grave.
  }
}
