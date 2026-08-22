import { matrixTones } from '@/components/matrix/matrix-ui'

/* ============================================================================
   EFFECT PALETTE

   The React Bits effects arrive from upstream in violet, magenta and cyan. This
   file is the one place their colour is decided, and it derives from
   `matrixTones` in matrix-ui.tsx so the shaders cannot drift away from the
   interface they sit behind.

   Only `.line` is usable here: it is the one field in a tone that is a plain hex,
   which is all a shader uniform can be fed. The rest of a tone is rgba() and
   gradients meant for CSS.
   ========================================================================== */

/** Bright phosphor `#33ff66` — the lit edge of every cable and every ring. */
export const EFFECT_BRIGHT = matrixTones.matrix.line

/** Mid phosphor `#3fbf66` — structure, the strands that read as background. */
export const EFFECT_MID = matrixTones.phosphor.line

/** Data teal `#2fe3ba` — the second hue, so a gradient has somewhere to go. */
export const EFFECT_DATA = matrixTones.data.line

/** Alarm red `#ff4d4d` — failure. Used only where the panel is already `alarm`. */
export const EFFECT_ALARM = matrixTones.alarm.line

/**
 * Deep phosphor — the tunnel's body, behind its lit rim.
 *
 * This is `phosphor-700` from the Tailwind scale rather than a tone's `.line`,
 * because no tone exposes a stop this dark as a hex. It is dim on purpose: the
 * tunnel walls are meant to be felt, not read.
 */
export const EFFECT_DEEP = '#0b602b'

/**
 * The three-stop ramp handed to Strands, bright → mid → teal. Frozen because a
 * shader reads it every frame and nothing should be able to mutate it in place.
 */
export const EFFECT_RAMP: readonly string[] = Object.freeze([EFFECT_BRIGHT, EFFECT_MID, EFFECT_DATA])

/**
 * PixelCard takes its colours as one comma-joined string, not an array — that is
 * the upstream prop shape and it is left alone.
 *
 * The green cards use a deliberately dimmer pixel ramp so the animation supports
 * the copy instead of competing with it. The brightest phosphor is reserved for
 * borders, labels and other small accents where it remains easy to read.
 */
export const EFFECT_PIXELS = '#1f9d45,#287d42,#0b3f20'

/**
 * The alarm equivalent, for pixel fields inside red-toned panels — the failure
 * cards on the landing page. A green shimmer under copy about silent price drift
 * reads as "all clear", which is the opposite of the point.
 *
 * `alarm.line` is the tone's hex; the two darker stops are `alarm-700`/`alarm-900`
 * from the Tailwind scale, which no tone exposes as a hex.
 */
export const EFFECT_ALARM_PIXELS = `${matrixTones.alarm.line},#920f0f,#330606`
