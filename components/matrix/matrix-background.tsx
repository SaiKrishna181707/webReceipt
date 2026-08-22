'use client'

import DotField from '@/components/effects/DotField'

export function MatrixBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <DotField
        dotRadius={1.35}
        dotSpacing={16}
        cursorRadius={132}
        bulgeStrength={28}
        glowRadius={36}
        sparkle={false}
        waveAmplitude={0}
        gradientFrom="#08733a"
        gradientTo="#48e886"
        glowColor="#00ff66"
      />
    </div>
  )
}
