import { PerformanceMonitor } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useState } from 'react'

/** Highest pixel ratio we ever render at: beyond 2x the extra pixels cost more than they show. */
export const maxDpr = (high: boolean) => (high ? Math.min(window.devicePixelRatio || 1, 2) : 1)

const STEPS = [1, 0.75, 0.625]

/**
 * Lowers the render resolution step by step when the frame rate cannot hold, and raises it again
 * when there is headroom. Keeps phones smooth at the cost of a slightly softer image.
 */
export function AdaptiveDpr({ high }: { high: boolean }) {
  const setDpr = useThree((s) => s.setDpr)
  const [step, setStep] = useState(0)
  const apply = (next: number) => {
    const s = Math.max(0, Math.min(STEPS.length - 1, next))
    setStep(s)
    setDpr(Math.max(1, maxDpr(high) * STEPS[s]))
  }
  if (!high) return null
  return <PerformanceMonitor bounds={() => [50, 58]} flipflops={4} onDecline={() => apply(step + 1)} onIncline={() => apply(step - 1)} />
}
