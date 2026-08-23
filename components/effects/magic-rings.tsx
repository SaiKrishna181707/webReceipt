'use client'

import { useEffect, useRef } from 'react'
import { Renderer, Program, Mesh, Triangle } from 'ogl'
import { useReducedMotion } from '@/components/matrix/use-reduced-motion'
import { EFFECT_BRIGHT, EFFECT_DATA } from './palette'

/* ============================================================================
   MAGIC RINGS — React Bits, ported from three.js to ogl.

   Concentric rings expanding out of a point and fading as they go. The whole
   effect is one fragment shader over a full-screen triangle, so three.js was
   supplying a scene graph, a camera and a mesh abstraction that nothing here
   used — 23 MB of dependency for a 30-line shader. ogl draws the same thing and
   is already in the bundle for the tunnel.

   The shader is upstream's, unchanged. The prop names, defaults and behaviour
   are upstream's too, so anything written against the published API still works.

   Changes from upstream:
     - `'use client'`
     - ogl instead of three (`Renderer`/`Program`/`Mesh`/`Triangle`)
     - phosphor → teal by default instead of magenta → cyan (see ./palette)
     - honours `prefers-reduced-motion`: renders one frame, then stops
     - the pointer listeners are only attached when a prop actually reads the
       pointer, so a decorative instance does not wake on every mousemove
   ========================================================================== */

/** ogl's `Triangle` supplies `position` as a vec2; no matrices are involved. */
const VERT = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;

uniform float uTime, uAttenuation, uLineThickness;
uniform float uBaseRadius, uRadiusStep, uScaleRate;
uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;
uniform float uFadeIn, uFadeOut;
uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;
uniform vec2 uResolution, uMouse;
uniform vec3 uColor, uColorTwo;
uniform int uRingCount;

const float HP = 1.5707963;
const float CYCLE = 3.45;

float fade(float t) {
  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);
}

float ring(vec2 p, float ri, float cut, float t0, float px) {
  float t = mod(uTime + t0, CYCLE);
  float r = ri + t / CYCLE * uScaleRate;
  float d = abs(length(p) - r);
  float a = atan(abs(p.y), abs(p.x)) / HP;
  float th = max(1.0 - a, 0.5) * px * uLineThickness;
  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;
  d += pow(cut * a, 3.0) * r;
  return h * exp(-uAttenuation * d) * fade(t);
}

void main() {
  float px = 1.0 / min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;
  float cr = cos(uRotation), sr = sin(uRotation);
  p = mat2(cr, -sr, sr, cr) * p;
  p -= uMouse * uMouseInfluence;
  float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;
  p /= sc;
  vec3 c = vec3(0.0);
  float rcf = max(float(uRingCount) - 1.0, 1.0);
  for (int i = 0; i < 10; i++) {
    if (i >= uRingCount) break;
    float fi = float(i);
    vec2 pr = p - fi * uParallax * uMouse;
    vec3 rc = mix(uColor, uColorTwo, fi / rcf);
    c = mix(c, rc, vec3(ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px)));
  }
  c *= 1.0 + uBurst * 2.0;
  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) * uNoiseAmount;
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * uOpacity);
}
`

export interface MagicRingsProps {
  color?: string
  colorTwo?: string
  speed?: number
  ringCount?: number
  attenuation?: number
  lineThickness?: number
  baseRadius?: number
  radiusStep?: number
  scaleRate?: number
  opacity?: number
  blur?: number
  noiseAmount?: number
  rotation?: number
  ringGap?: number
  fadeIn?: number
  fadeOut?: number
  followMouse?: boolean
  mouseInfluence?: number
  hoverScale?: number
  parallax?: number
  clickBurst?: boolean
  className?: string
}

/** `#rrggbb` → three floats in 0–1, which is what a vec3 uniform wants. */
const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return [1, 1, 1]
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
}

export default function MagicRings({
  color = EFFECT_BRIGHT,
  colorTwo = EFFECT_DATA,
  speed = 1,
  ringCount = 6,
  attenuation = 10,
  lineThickness = 2,
  baseRadius = 0.35,
  radiusStep = 0.1,
  scaleRate = 0.1,
  opacity = 1,
  blur = 0,
  noiseAmount = 0.1,
  rotation = 0,
  ringGap = 1.5,
  fadeIn = 0.7,
  fadeOut = 0.5,
  followMouse = false,
  mouseInfluence = 0.2,
  hoverScale = 1.2,
  parallax = 0.05,
  clickBurst = false,
  className = '',
}: MagicRingsProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const propsRef = useRef<Required<Omit<MagicRingsProps, 'className'>> | null>(null)
  const mouseRef = useRef([0, 0])
  const smoothMouseRef = useRef([0, 0])
  const hoverAmountRef = useRef(0)
  const isHoveredRef = useRef(false)
  const burstRef = useRef(0)
  const reduced = useReducedMotion()
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced

  propsRef.current = {
    color,
    colorTwo,
    speed,
    ringCount,
    attenuation,
    lineThickness,
    baseRadius,
    radiusStep,
    scaleRate,
    opacity,
    blur,
    noiseAmount,
    rotation,
    ringGap,
    fadeIn,
    fadeOut,
    followMouse,
    mouseInfluence,
    hoverScale,
    parallax,
    clickBurst,
  }

  /* Whether the pointer matters at all. Upstream always listens; a purely
     decorative instance with all three off has no reason to. Read once per mount
     because changing it would mean re-attaching listeners mid-effect. */
  const wantsPointer = followMouse || hoverScale !== 1 || clickBurst
  const wantsPointerRef = useRef(wantsPointer)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer: InstanceType<typeof Renderer>
    try {
      renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      })
    } catch {
      // No WebGL at all. The effect is decorative, so failing silently is right.
      return
    }

    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    const canvas = gl.canvas as HTMLCanvasElement
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    mount.appendChild(canvas)

    const geometry = new Triangle(gl)
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uAttenuation: { value: attenuation },
        uResolution: { value: new Float32Array([1, 1]) },
        uColor: { value: new Float32Array(hexToRgb(color)) },
        uColorTwo: { value: new Float32Array(hexToRgb(colorTwo)) },
        uLineThickness: { value: lineThickness },
        uBaseRadius: { value: baseRadius },
        uRadiusStep: { value: radiusStep },
        uScaleRate: { value: scaleRate },
        uRingCount: { value: ringCount },
        uOpacity: { value: opacity },
        uNoiseAmount: { value: noiseAmount },
        uRotation: { value: 0 },
        uRingGap: { value: ringGap },
        uFadeIn: { value: fadeIn },
        uFadeOut: { value: fadeOut },
        uMouse: { value: new Float32Array([0, 0]) },
        uMouseInfluence: { value: 0 },
        uHoverAmount: { value: 0 },
        uHoverScale: { value: hoverScale },
        uParallax: { value: parallax },
        uBurst: { value: 0 },
      },
    })
    const mesh = new Mesh(gl, { geometry, program })
    const u = program.uniforms as Record<string, { value: any }>

    /** Pushes the current props into the uniforms and draws one frame. */
    const draw = () => {
      const p = propsRef.current!
      u.uAttenuation.value = p.attenuation
      const c1 = hexToRgb(p.color)
      const cu = u.uColor.value as Float32Array
      cu[0] = c1[0]
      cu[1] = c1[1]
      cu[2] = c1[2]
      const c2 = hexToRgb(p.colorTwo)
      const c2u = u.uColorTwo.value as Float32Array
      c2u[0] = c2[0]
      c2u[1] = c2[1]
      c2u[2] = c2[2]
      u.uLineThickness.value = p.lineThickness
      u.uBaseRadius.value = p.baseRadius
      u.uRadiusStep.value = p.radiusStep
      u.uScaleRate.value = p.scaleRate
      u.uRingCount.value = Math.min(Math.max(Math.round(p.ringCount), 1), 10)
      u.uOpacity.value = p.opacity
      u.uNoiseAmount.value = p.noiseAmount
      u.uRotation.value = (p.rotation * Math.PI) / 180
      u.uRingGap.value = p.ringGap
      u.uFadeIn.value = p.fadeIn
      u.uFadeOut.value = p.fadeOut
      const mu = u.uMouse.value as Float32Array
      mu[0] = smoothMouseRef.current[0]
      mu[1] = smoothMouseRef.current[1]
      u.uMouseInfluence.value = p.followMouse ? p.mouseInfluence : 0
      u.uHoverAmount.value = hoverAmountRef.current
      u.uHoverScale.value = p.hoverScale
      u.uParallax.value = p.parallax
      u.uBurst.value = p.clickBurst ? burstRef.current : 0
      renderer.render({ scene: mesh })
    }

    const resize = () => {
      const w = Math.max(1, mount.clientWidth)
      const h = Math.max(1, mount.clientHeight)
      renderer.setSize(w, h)
      const res = u.uResolution.value as Float32Array
      res[0] = gl.drawingBufferWidth
      res[1] = gl.drawingBufferHeight
      draw()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(mount)
    resize()

    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect()
      mouseRef.current[0] = (e.clientX - rect.left) / rect.width - 0.5
      mouseRef.current[1] = -((e.clientY - rect.top) / rect.height - 0.5)
    }
    const onMouseEnter = () => {
      isHoveredRef.current = true
    }
    const onMouseLeave = () => {
      isHoveredRef.current = false
      mouseRef.current[0] = 0
      mouseRef.current[1] = 0
    }
    const onClick = () => {
      burstRef.current = 1
    }

    /* Captured into the effect scope so the cleanup below removes exactly the
       listeners this run added. The ref is written once at mount and never
       again, so this is the same value either way -- but reading it twice makes
       react-hooks/exhaustive-deps flag a staleness hazard that would be real if
       anything ever did start updating it. */
    const pointerEnabled = wantsPointerRef.current

    if (pointerEnabled) {
      mount.addEventListener('mousemove', onMouseMove)
      mount.addEventListener('mouseenter', onMouseEnter)
      mount.addEventListener('mouseleave', onMouseLeave)
      mount.addEventListener('click', onClick)
    }

    let frameId = 0
    let isVisible = false
    let isPageVisible = !document.hidden
    let elapsed = 0
    let lastT = 0

    const animate = (t: number) => {
      const p = propsRef.current!

      const dt = lastT === 0 ? 0 : Math.min(t - lastT, 100)
      lastT = t
      elapsed += dt * 0.001 * p.speed

      smoothMouseRef.current[0] += (mouseRef.current[0] - smoothMouseRef.current[0]) * 0.08
      smoothMouseRef.current[1] += (mouseRef.current[1] - smoothMouseRef.current[1]) * 0.08
      hoverAmountRef.current += ((isHoveredRef.current ? 1 : 0) - hoverAmountRef.current) * 0.08
      burstRef.current *= 0.95
      if (burstRef.current < 0.001) burstRef.current = 0

      u.uTime.value = elapsed
      draw()

      if (reducedRef.current) {
        frameId = 0
        return
      }
      frameId = requestAnimationFrame(animate)
    }

    const tryStart = () => {
      if (reducedRef.current) {
        draw()
        return
      }
      if (isVisible && isPageVisible && frameId === 0) {
        lastT = 0
        frameId = requestAnimationFrame(animate)
      }
    }
    const tryStop = () => {
      if (frameId !== 0) {
        cancelAnimationFrame(frameId)
        frameId = 0
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
        isVisible ? tryStart() : tryStop()
      },
      { threshold: 0 }
    )
    io.observe(mount)

    const onVisibility = () => {
      isPageVisible = !document.hidden
      isPageVisible ? tryStart() : tryStop()
    }
    document.addEventListener('visibilitychange', onVisibility)

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotionPref = () => {
      reducedRef.current = media.matches
      if (media.matches) {
        tryStop()
        draw()
      } else {
        tryStart()
      }
    }
    media.addEventListener?.('change', onMotionPref)

    tryStart()

    return () => {
      tryStop()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      media.removeEventListener?.('change', onMotionPref)
      if (pointerEnabled) {
        mount.removeEventListener('mousemove', onMouseMove)
        mount.removeEventListener('mouseenter', onMouseEnter)
        mount.removeEventListener('mouseleave', onMouseLeave)
        mount.removeEventListener('click', onClick)
      }
      try {
        mount.removeChild(canvas)
      } catch {}
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={mountRef}
      className={`h-full w-full ${className}`.trim()}
      style={blur > 0 ? { filter: `blur(${blur}px)` } : undefined}
    />
  )
}
