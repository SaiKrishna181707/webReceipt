'use client'

import { Renderer, Program, Mesh, Color, Triangle } from 'ogl'
import { useEffect, useRef, type CSSProperties } from 'react'
import { useReducedMotion } from '@/components/matrix/use-reduced-motion'
import { EFFECT_RAMP } from './palette'

const MAX_STRANDS = 12
const MAX_COLORS = 8

const VERT = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`

const FRAG = `#version 300 es
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform int uStrandCount;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaviness;
uniform float uThickness;
uniform float uGlow;
uniform float uTaper;
uniform float uSpread;
uniform float uHueShift;
uniform float uIntensity;
uniform float uOpacity;
uniform float uScale;
uniform float uSaturation;
out vec4 fragColor;
const float PI = 3.14159265;
vec3 spectrum(float t) { return 0.5 + 0.5 * cos(2.0 * PI * (t + vec3(0.00, 0.33, 0.67))); }
vec3 samplePalette(float t) {
  t = fract(t);
  float scaled = t * float(uColorCount);
  int idx = int(floor(scaled));
  float blend = fract(scaled);
  int nextIdx = idx + 1;
  if (nextIdx >= uColorCount) nextIdx = 0;
  return mix(uColors[idx], uColors[nextIdx], blend);
}
vec3 strandColor(float t) { return uColorCount > 0 ? samplePalette(t) : spectrum(t); }
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  uv /= max(uScale, 0.0001);
  float e = 0.06 + uIntensity * 0.94;
  float env = pow(max(cos(uv.x * PI * 1.3), 0.0), uTaper);
  vec3 col = vec3(0.0);
  for (int i = 0; i < ${MAX_STRANDS}; i++) {
    if (i >= uStrandCount) break;
    float fi = float(i);
    float ph = fi * 1.7 * uSpread;
    float freq = (2.0 + fi * 0.35) * uWaviness;
    float spd = 1.4 + fi * 1.2;
    float tt = uTime * uSpeed;
    float w = sin(uv.x * freq + tt * spd + ph) * 0.60 + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + ph * 1.7) * 0.40;
    float amp = (0.1 + 0.02 * e) * env * uAmplitude;
    float y = w * amp;
    float d = abs(uv.y - y);
    float thick = (0.001 + 0.05 * e) * (0.35 + env) * uThickness;
    float g = thick / (d + thick * 0.45);
    g = g * g;
    float h = fi / float(uStrandCount) + uv.x * 0.30 + uTime * 0.04 + uHueShift;
    col += strandColor(h) * g * env;
  }
  col *= 0.45 + 0.7 * e;
  col = 1.0 - exp(-col * uGlow);
  float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(gray), col, uSaturation), 0.0);
  float lum = max(max(col.r, col.g), col.b);
  float alpha = clamp(lum, 0.0, 1.0) * uOpacity;
  fragColor = vec4(col * uOpacity, alpha);
}
`

export interface StrandsProps {
  colors?: readonly string[]
  count?: number
  speed?: number
  amplitude?: number
  waviness?: number
  thickness?: number
  glow?: number
  taper?: number
  spread?: number
  hueShift?: number
  intensity?: number
  saturation?: number
  opacity?: number
  scale?: number
  glass?: boolean
  refraction?: number
  dispersion?: number
  glassSize?: number
  className?: string
  style?: CSSProperties
}

const buildPalette = (colors: readonly string[]): number[][] => {
  const filled = colors?.length ? colors : ['#ffffff']
  return Array.from({ length: MAX_COLORS }, (_, i) => {
    const c = new Color(filled[i] ?? filled[filled.length - 1])
    return [c.r, c.g, c.b]
  })
}

export default function Strands({
  colors = EFFECT_RAMP,
  count = 3,
  speed = 0.5,
  amplitude = 1,
  waviness = 1,
  thickness = 0.7,
  glow = 2.6,
  taper = 3,
  spread = 1,
  hueShift = 0,
  intensity = 0.6,
  saturation = 1.5,
  opacity = 1,
  scale = 1.5,
  glass = false,
  refraction = 1,
  dispersion = 1,
  glassSize = 1,
  className = '',
  style,
}: StrandsProps) {
  const ctnDom = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced
  const propsRef = useRef({ colors, count, speed, amplitude, waviness, thickness, glow, taper, spread, hueShift, intensity, saturation, opacity, scale, glass, refraction, dispersion, glassSize })
  propsRef.current = { colors, count, speed, amplitude, waviness, thickness, glow, taper, spread, hueShift, intensity, saturation, opacity, scale, glass, refraction, dispersion, glassSize }

  useEffect(() => {
    const ctn = ctnDom.current
    if (!ctn) return

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 1.5) })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.canvas.style.backgroundColor = 'transparent'

    const geometry = new Triangle(gl)
    if (geometry.attributes.uv) delete geometry.attributes.uv

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uColors: { value: buildPalette(propsRef.current.colors) },
        uColorCount: { value: Math.min(propsRef.current.colors.length, MAX_COLORS) },
        uStrandCount: { value: Math.min(propsRef.current.count, MAX_STRANDS) },
        uSpeed: { value: speed }, uAmplitude: { value: amplitude }, uWaviness: { value: waviness },
        uThickness: { value: thickness }, uGlow: { value: glow }, uTaper: { value: taper }, uSpread: { value: spread },
        uHueShift: { value: hueShift }, uIntensity: { value: intensity }, uOpacity: { value: opacity }, uScale: { value: scale },
        uSaturation: { value: saturation },
      },
    })
    const mesh = new Mesh(gl, { geometry, program })

    const draw = (t: number) => {
      const current = propsRef.current
      program.uniforms.uTime.value = t * 0.001
      program.uniforms.uColors.value = buildPalette(current.colors)
      program.uniforms.uColorCount.value = Math.min(current.colors.length, MAX_COLORS)
      program.uniforms.uStrandCount.value = Math.min(Math.max(Math.round(current.count), 1), MAX_STRANDS)
      program.uniforms.uSpeed.value = current.speed
      program.uniforms.uAmplitude.value = current.amplitude
      program.uniforms.uWaviness.value = current.waviness
      program.uniforms.uThickness.value = current.thickness
      program.uniforms.uGlow.value = current.glow
      program.uniforms.uTaper.value = current.taper
      program.uniforms.uSpread.value = current.spread
      program.uniforms.uHueShift.value = current.hueShift
      program.uniforms.uIntensity.value = current.intensity
      program.uniforms.uOpacity.value = current.opacity
      program.uniforms.uScale.value = current.scale
      program.uniforms.uSaturation.value = current.saturation
      renderer.render({ scene: mesh })
    }

    ctn.appendChild(gl.canvas)
    const resize = () => {
      const width = Math.max(1, ctn.offsetWidth)
      const height = Math.max(1, ctn.offsetHeight)
      renderer.setSize(width, height)
      program.uniforms.uResolution.value = [width, height]
      if (reducedRef.current) draw(performance.now())
    }
    const ro = new ResizeObserver(resize)
    ro.observe(ctn)
    resize()

    let animationId = 0
    const update = (t: number) => {
      draw(t)
      if (!reducedRef.current) animationId = requestAnimationFrame(update)
      else animationId = 0
    }
    const start = () => {
      if (reducedRef.current) draw(performance.now())
      else if (animationId === 0) animationId = requestAnimationFrame(update)
    }
    const stop = () => {
      if (animationId !== 0) cancelAnimationFrame(animationId)
      animationId = 0
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      stop()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      if (ctn.contains(gl.canvas)) ctn.removeChild(gl.canvas)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
    /* Init-once: the deps this rule wants are shader uniforms read at setup.
       Listing them would tear down and rebuild the WebGL context on every prop
       change instead of animating through it. Same pattern as magic-rings and
       pixel-card. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={ctnDom} className={`relative h-full w-full bg-transparent ${className}`} style={style} />
}
