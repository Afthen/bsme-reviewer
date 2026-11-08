/**
 * src/repetition/constants.js
 * Mathematical & Cognitive Decay Foundations (Golden Ratio & Fibonacci).
 */

const PHI_BASE = (1 + Math.sqrt(5)) / 2; // 1.6180339887...

/**
 * Dynamic Golden Ratio function:
 *   phi(1)  = PHI
 *   phi(2)  = PHI^2
 *   phi(0)  = 1
 *   phi(-1) = 1 / PHI
 *   phi(-n) = PHI^(-n)
 */
export function phi(n = 1) {
  if (n === 0) return 1;
  if (n === 1) return PHI_BASE;
  if (n === -1) return 1 / PHI_BASE;
  return Math.pow(PHI_BASE, n);
}

/**
 * Dynamic Fibonacci generator:
 *   fib(0)=0, fib(1)=1, fib(2)=1, fib(3)=2, fib(4)=3, fib(5)=5, fib(6)=8, fib(7)=13, fib(8)=21 ...
 */
export function fib(n) {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const c = a + b;
    a = b;
    b = c;
  }
  return b;
}

// Backwards-compatible constants evaluated via phi() and fib()
export const PHI = phi(1);
export const PHI_INV = phi(-1);
export const PHI_INV2 = phi(-2);
export const PHI_INV3 = phi(-3);
export const PHI_INV6 = phi(-6);
export const PHI_INV7 = phi(-7);
export const PHI_INV8 = phi(-8);

export const FADING_THRESHOLD = 1 - phi(-3); // ~0.7639 (76.4%)

export const FIB_2 = fib(3);  // 2
export const FIB_3 = fib(4);  // 3
export const FIB_5 = fib(5);  // 5
export const FIB_8 = fib(6);  // 8
export const FIB_13 = fib(7); // 13
export const FIB_21 = fib(8); // 21

export const VALID_WINDOWS = Object.freeze([FIB_2, FIB_3, FIB_5, FIB_8, FIB_13, FIB_21]);
export const MAX_HISTORY = FIB_21;

export function snapToFibonacci(val) {
  return VALID_WINDOWS.reduce((prev, curr) =>
    Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
  );
}
