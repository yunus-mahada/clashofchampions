/**
 * Haptic feedback utility with safe fallback
 */
export const Haptics = {
  click: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }
    } catch {}
  },

  correct: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch {}
  },

  wrong: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 40, 80]);
      }
    } catch {}
  },

  celebrate: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60, 100, 60, 140]);
      }
    } catch {}
  },
};
