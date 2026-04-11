'use client';

import {motion, useReducedMotion} from 'framer-motion';
import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

interface HomeRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export function HomeReveal({children, className, delay = 0, y = 20}: HomeRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y}}
      whileInView={prefersReducedMotion ? {opacity: 1} : {opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.2}}
      transition={{duration: prefersReducedMotion ? 0 : 0.45, delay, ease: [0.22, 1, 0.36, 1]}}
    >
      {children}
    </motion.div>
  );
}
