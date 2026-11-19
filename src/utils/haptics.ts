/**
 * Triggers subtle device haptic feedback using the Web Vibration API
 * when supported by the user's browser/device.
 */
export function triggerHaptic(pattern: number | number[] = 12): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore unsupported or blocked vibration calls
  }
}
