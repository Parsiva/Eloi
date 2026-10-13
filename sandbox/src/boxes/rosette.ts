// A WebGL2 box: a guilloche rosette (the security-printing line families from research/04),
// standing in for isidex's regl diagram or the city game's map. It exercises the GPU parts of
// the box contract: size and pixel ratio are pushed by the frame, frames are requested only
// while visible, reduced motion freezes it, and dispose releases the GL context.
import type { BoxRuntime } from '@eloi/engine'

const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uInk;
uniform vec3 uPaper;
out vec4 outColor;
void main() {
  float s = min(uRes.x, uRes.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / s * 2.0;
  float r = length(p);
  float a = atan(p.y, p.x);
  float px = 2.0 / s;
  float ink = 0.0;
  for (int i = 0; i < 22; i++) {
    float f = float(i);
    float wave = sin(7.0 * a + f * 0.2856 + uTime * 0.3) * (0.62 + 0.38 * sin(3.0 * a - uTime * 0.17 + f * 0.05));
    float rr = (0.52 + 0.2 * wave) * (0.74 + f * 0.0125);
    ink += 1.0 - smoothstep(0.35 * px, 1.4 * px, abs(r - rr));
  }
  float rim = 1.0 - smoothstep(0.4 * px, 1.4 * px, abs(r - 0.93));
  ink = clamp(ink * 0.85 + rim, 0.0, 1.0);
  outColor = vec4(mix(uPaper, uInk, ink), 1.0);
}`

const INKS: [number, number, number][] = [
  [0.17, 0.14, 0.1],
  [0.11, 0.27, 0.34],
  [0.45, 0.16, 0.12],
  [0.18, 0.32, 0.2],
  [0.36, 0.22, 0.42],
  [0.5, 0.36, 0.12],
]

export function createRosette(): BoxRuntime<{ paper: [number, number, number] }> {
  let gl: WebGL2RenderingContext | null = null
  return {
    mount(el, ctx) {
      const canvas = document.createElement('canvas')
      canvas.className = 'rosette'
      canvas.setAttribute('role', 'img')
      canvas.setAttribute('aria-label', 'An animated guilloche rosette drawn with WebGL2')
      el.append(canvas)
      gl = canvas.getContext('webgl2', { antialias: false, alpha: false })
      if (!gl) throw new Error('WebGL2 is not available in this browser')
      const program = link(gl)
      const uRes = gl.getUniformLocation(program, 'uRes')
      const uTime = gl.getUniformLocation(program, 'uTime')
      const uInk = gl.getUniformLocation(program, 'uInk')
      const uPaper = gl.getUniformLocation(program, 'uPaper')
      const selected = ctx.channel<string | null>('selected', null)
      let ink = INKS[0]!
      let time = 0

      // Size is pushed, never measured: the drawing buffer follows the frame's geometry.
      ctx.effect(() => {
        const g = ctx.geometry.value
        canvas.width = Math.max(1, Math.round(g.inline * g.dpr))
        canvas.height = Math.max(1, Math.round(g.block * g.dpr))
        ctx.requestFrame()
      })
      // Another box picks a project; the rosette takes that project's ink.
      ctx.effect(() => {
        const slug = selected.value
        ink = slug ? INKS[hash(slug) % INKS.length]! : INKS[0]!
        ctx.requestFrame()
      })
      ctx.effect(() => {
        if (ctx.visible.value) ctx.requestFrame()
      })
      ctx.onFrame((_t, dt) => {
        const g = gl!
        const animate = ctx.visible.value && !ctx.reducedMotion.value
        if (animate) time += dt / 1000
        g.viewport(0, 0, canvas.width, canvas.height)
        g.useProgram(program)
        g.uniform2f(uRes, canvas.width, canvas.height)
        g.uniform1f(uTime, time)
        g.uniform3f(uInk, ...ink)
        g.uniform3f(uPaper, ...(ctx.input.value?.paper ?? [0.9, 0.86, 0.76]))
        g.drawArrays(g.TRIANGLES, 0, 3)
        if (animate) ctx.requestFrame()
      })
    },
    dispose() {
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
      gl = null
    },
  }
}

function link(gl: WebGL2RenderingContext): WebGLProgram {
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, source)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader failed to compile')
    return s
  }
  const program = gl.createProgram()!
  gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'program failed to link')
  return program
}

function hash(s: string): number {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}
