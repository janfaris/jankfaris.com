/**
 * Motion plays by default on this page, even when the OS asks for reduced
 * motion. Visitors who want stillness use the footer switch; that choice is
 * remembered on the device.
 */
const KEY = 'bahia-motion'

/** Mirror of the current choice for code outside React (text decoding). */
export const motion = { reduced: false }

export function readReducedPreference() {
  try {
    return localStorage.getItem(KEY) === 'reduced'
  } catch {
    return false
  }
}

export function writeReducedPreference(reduced: boolean) {
  try {
    if (reduced) localStorage.setItem(KEY, 'reduced')
    else localStorage.removeItem(KEY)
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this visit.
  }
}
