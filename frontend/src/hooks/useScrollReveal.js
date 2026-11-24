import { useEffect, useRef } from 'react';

/**
 * IntersectionObserver-powered scroll-reveal hook.
 * Adds `.revealed` class to children matching `selector` as they enter the viewport.
 *
 * @param {string}  selector  - CSS selector for elements inside the ref to observe
 * @param {object}  options   - { threshold, rootMargin, stagger (ms between each child) }
 */
export default function useScrollReveal(selector = '.reveal', { threshold = 0.15, rootMargin = '0px 0px -40px 0px', stagger = 100 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target;
            const idx = target.dataset.revealIndex ?? 0;
            target.style.transitionDelay = `${idx * stagger}ms`;
            target.classList.add('revealed');
            observer.unobserve(target);
          }
        });
      },
      { threshold, rootMargin }
    );

    const targets = el.querySelectorAll(selector);
    targets.forEach((t, i) => {
      t.dataset.revealIndex = i;
      observer.observe(t);
    });

    return () => observer.disconnect();
  }, [selector, threshold, rootMargin, stagger]);

  return ref;
}
