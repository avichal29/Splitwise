import { useRef, useEffect, useState } from 'react';

/**
 * Scroll-triggered reveal wrapper.
 *   animation: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale' | 'zoom'
 *   stagger:   true → container stays visible, children cascade in via nth-child delays
 *   delay:     extra transition-delay (seconds)
 *   className: forwarded to the wrapper div (e.g. grid classes)
 *   threshold: IntersectionObserver threshold (0–1)
 */
export default function Reveal({
  children,
  animation = 'fade-up',
  delay = 0,
  stagger = false,
  className = '',
  threshold = 0.08,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`reveal reveal-${animation}${stagger ? ' reveal-stagger' : ''}${visible ? ' revealed' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
