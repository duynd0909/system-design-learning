export const spring = { type: 'spring', stiffness: 300, damping: 24 } as const;
export const springBouncy = { type: 'spring', stiffness: 400, damping: 17 } as const;
export const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
export const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 } };
export const scaleIn = { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 } };
export const STAGGER = { staggerChildren: 0.08, delayChildren: 0.1 } as const;
