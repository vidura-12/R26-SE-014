import { useState, useRef, useEffect } from 'react';

/**
 * Hook to trigger animations when element enters viewport
 * @param {number} threshold - Intersection observer threshold (0-1)
 * @returns {Object} - { ref, visible }
 */
export function useScrollReveal(threshold = 0.15) {
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
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/**
 * ScrollReveal Component - Animates children when they enter viewport
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to animate
 * @param {string} props.direction - Animation direction: 'left', 'right', 'up', 'down'
 * @param {number} props.delay - Animation delay in seconds
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.threshold - Intersection observer threshold
 */
export function ScrollReveal({
  children,
  direction = 'left',
  delay = 0,
  className = '',
  threshold = 0.15,
}) {
  const { ref, visible } = useScrollReveal(threshold);

  const translateX =
    direction === 'left' ? '-60px' : direction === 'right' ? '60px' : '0';
  const translateY =
    direction === 'up' ? '60px' : direction === 'down' ? '-60px' : '0';

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translate(0, 0)'
          : `translate(${translateX}, ${translateY})`,
        transition: `all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s`,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
}
