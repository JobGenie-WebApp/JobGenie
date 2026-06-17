/**
 * Scroll Performance Utilities
 * 
 * Optimizes landing page scroll performance by:
 * 1. Detecting scroll events with debouncing
 * 2. Managing GPU layers efficiently
 * 3. Preventing layout thrashing
 */

/**
 * Disable smooth scroll for better performance
 * Browsers handle smooth scroll via JavaScript, causing jank on scroll
 * Instead: Use Intersection Observer for animations + native scroll
 */
export function optimizeScrollBehavior() {
  // Modern browsers: prefer native scroll for performance
  // Prefer native scroll; use Intersection Observer or CSS for scroll-linked effects.
  if (typeof window !== 'undefined') {
    document.documentElement.style.scrollBehavior = 'auto';
  }
}

/**
 * Debounce scroll events to prevent excessive repaints
 */
export function createScrollListener(callback: () => void, delayMs = 100) {
  let timeoutId: NodeJS.Timeout | null = null;

  const scrollHandler = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delayMs);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', scrollHandler, { passive: true });

    return () => {
      window.removeEventListener('scroll', scrollHandler);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }

  return () => {};
}

/**
 * Enable hardware acceleration for smooth animations
 * Works with Framer Motion's transform animations
 */
export function enableGPUAcceleration(element: HTMLElement) {
  if (element) {
    element.style.backfaceVisibility = 'hidden';
    element.style.setProperty('-webkit-font-smoothing', 'antialiased');
    element.style.willChange = 'transform';
  }
}

/**
 * Create intersection observer for scroll animations
 * Triggers animations only when elements come into view
 */
export function createIntersectionObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
) {
  if (typeof window === 'undefined') return null;

  return new IntersectionObserver((entries) => {
    entries.forEach(callback);
  }, {
    threshold: 0.1,
    ...options,
  });
}
