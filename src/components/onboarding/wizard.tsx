'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { OnboardingStep } from '@/types/hyperframes';

interface WizardProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  storageKey: string;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getTooltipPosition(
  rect: SpotlightRect,
  placement: OnboardingStep['placement'],
) {
  const gap = 16;
  switch (placement) {
    case 'top':
      return { top: rect.top - gap, left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' };
    case 'bottom':
      return { top: rect.top + rect.height + gap, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' };
    case 'left':
      return { top: rect.top + rect.height / 2, left: rect.left - gap, transform: 'translate(-100%, -50%)' };
    case 'right':
      return { top: rect.top + rect.height / 2, left: rect.left + rect.width + gap, transform: 'translateY(-50%)' };
  }
}

function buildClipPath(rect: SpotlightRect, padding = 6) {
  const t = rect.top - padding;
  const l = rect.left - padding;
  const r = rect.left + rect.width + padding;
  const b = rect.top + rect.height + padding;
  return `polygon(
    0% 0%, 100% 0%, 100% 100%, 0% 100%,
    0% ${t}px, ${l}px ${t}px, ${l}px ${b}px, ${r}px ${b}px, ${r}px ${t}px, 0% ${t}px
  )`;
}

export function OnboardingWizard({ steps, onComplete, storageKey }: WizardProps) {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const isCompletedKey = `${storageKey}_completed`;

  // First-visit detection
  useEffect(() => {
    const done = localStorage.getItem(isCompletedKey) === 'true';
    if (!done && steps.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional first-visit detection
      setVisible(true);
    }
  }, [isCompletedKey, steps.length]);

  // Measure target element for spotlight
  const measureTarget = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;
    const el = document.querySelector(step.targetSelector);
    if (!el) {
      setSpotlight({ top: 0, left: 0, width: 0, height: 0 });
      return;
    }
    const r = el.getBoundingClientRect();
    setSpotlight({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [steps, currentStep]);

  useLayoutEffect(() => {
    if (!visible) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional DOM measurement
    measureTarget();
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [visible, measureTarget]);

  const finish = useCallback(() => {
    localStorage.setItem(isCompletedKey, 'true');
    setVisible(false);
    setShowConfetti(false);
    onComplete();
  }, [isCompletedKey, onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setShowConfetti(true);
      setTimeout(finish, 1800);
    }
  }, [currentStep, steps.length, finish]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    finish();
  }, [finish]);

  if (!visible || !spotlight) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const tooltipPos = getTooltipPosition(spotlight, step.placement);
  const clipPath = buildClipPath(spotlight);

  return (
    <div className="hf-wizard-overlay" style={{ clipPath }}>
      {/* Spotlight border glow */}
      {spotlight.width > 0 && (
        <div
          style={{
            position: 'fixed',
            top: spotlight.top - 3,
            left: spotlight.left - 3,
            width: spotlight.width + 6,
            height: spotlight.height + 6,
            borderRadius: 6,
            border: '2px solid rgba(139, 92, 246, 0.8)',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
            pointerEvents: 'none',
            zIndex: 51,
          }}
        />
      )}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            ...tooltipPos,
            zIndex: 52,
          }}
          className="glass-panel rounded-xl p-5 max-w-sm"
        >
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-primary bg-primary/20 px-2 py-0.5 rounded-full">
              Step {currentStep + 1} of {steps.length}
            </span>
            {isLast && showConfetti && <ConfettiDots />}
          </div>

          {/* Content */}
          <h3 className="text-base font-semibold text-foreground mb-1">
            {isLast && showConfetti ? "You're Ready!" : step.title}
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Dot indicators */}
          <div className="flex gap-1.5 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === currentStep
                    ? 'w-4 bg-primary'
                    : i < currentStep
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-zinc-700'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Skip All
            </button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  Previous
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                {isLast ? "Let's Go!" : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── Simple CSS confetti dots ── */
const CONFETTI_DOTS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: (Math.sin(i * 1.7) * 60),
  y: -(Math.abs(Math.cos(i * 1.3)) * 40 + 10),
  size: (Math.sin(i * 2.1) + 1.5) * 2 + 2,
  color: ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'][i % 5],
  delay: (Math.sin(i * 0.9) + 1) * 0.15,
  duration: Math.abs(Math.cos(i * 1.1)) * 0.6 + 0.8,
}));

function ConfettiDots() {
  const dots = CONFETTI_DOTS;

  return (
    <span className="relative inline-flex ml-1" aria-hidden>
      {dots.map((d) => (
        <motion.span
          key={d.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{
            x: d.x,
            y: d.y,
            opacity: [1, 1, 0],
            scale: [0, 1, 0.5],
          }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            width: d.size,
            height: d.size,
            borderRadius: '50%',
            backgroundColor: d.color,
          }}
        />
      ))}
    </span>
  );
}
