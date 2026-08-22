'use client'

import DotField from '@/components/effects/DotField'

export function MatrixBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <DotField
        dotRadius={1.5}
        dotSpacing={14}
        bulgeStrength={67}
        glowRadius={160}
        sparkle={false}
        waveAmplitude={0}
        gradientFrom="#08733a"
        gradientTo="#48e886"
        glowColor="#00ff66"
      />
    </div>
  )
}
