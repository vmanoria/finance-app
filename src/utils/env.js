/**
 * env.js — environment flag abstraction.
 *
 * In the Vite browser build, __VITE_USE_MOCK__ is replaced at build time
 * by vite.config.js define. In Jest/Node, process.env.VITE_USE_MOCK is used.
 */

/* global __VITE_USE_MOCK__ */
function resolveUseMock() {
  // Node / Jest environment
  if (typeof process !== 'undefined' && process.env?.VITE_USE_MOCK === 'true') {
    return true;
  }
  // Vite build-time define (replaced by a string literal during bundling)
  try {
    // eslint-disable-next-line no-undef
    return typeof __VITE_USE_MOCK__ !== 'undefined' && __VITE_USE_MOCK__ === 'true';
  } catch {
    return false;
  }
}

export const USE_MOCK = resolveUseMock();
