// The rule language. Every number in a frame graph may be written as an expression: arithmetic,
// comparisons, `a ? b : c`, and a few functions (sin, cos, ramp, tri, …) over named values such
// as the screen size, the frame's parameters and, on a line, how far along it we are. Compiled
// once to closures; no eval.

export type Num = number | string
export type Env = Record<string, number>
export interface Compiled {
  (env: Env): number
  vars: ReadonlySet<string>
}

const smooth = (a: number, b: number, x: number) => {
  if (a === b) return x < a ? 0 : 1
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const fract = (x: number) => x - Math.floor(x)

// Functions get the environment first, so a few can read where on a line they are.
const FUNCS: Record<string, (env: Env, ...a: number[]) => number> = {
  sin: (_, x) => Math.sin(x),
  cos: (_, x) => Math.cos(x),
  tan: (_, x) => Math.tan(x),
  abs: (_, x) => Math.abs(x),
  sign: (_, x) => Math.sign(x),
  sqrt: (_, x) => Math.sqrt(x),
  exp: (_, x) => Math.exp(x),
  log: (_, x) => Math.log(x),
  floor: (_, x) => Math.floor(x),
  ceil: (_, x) => Math.ceil(x),
  round: (_, x) => Math.round(x),
  fract: (_, x) => fract(x),
  min: (_, ...a) => Math.min(...a),
  max: (_, ...a) => Math.max(...a),
  pow: (_, x, y) => Math.pow(x, y),
  hypot: (_, ...a) => Math.hypot(...a),
  atan2: (_, y, x) => Math.atan2(y, x),
  clamp: (_, x, a, b) => Math.min(b, Math.max(a, x)),
  mix: (_, a, b, t) => a + (b - a) * t,
  step: (_, edge, x) => (x < edge ? 0 : 1),
  smooth: (_, a, b, x) => smooth(a, b, x),
  // Waves with period 1 and range -1..1, to stand beside sin(tau * x).
  tri: (_, x) => 1 - 4 * Math.abs(fract(x + 0.25) - 0.5),
  saw: (_, x) => 2 * fract(x) - 1,
  square: (_, x) => (fract(x) < 0.5 ? 1 : -1),
  // On a line: 0 at both ends, rising to 1 over `a` from the start and `b` before the end.
  // This is how a strand leaves and meets its nodes cleanly. With no arguments it uses the
  // eases the line's two nodes ask for.
  ramp: (env, ...a) => {
    const rise = a.length ? a[0]! : (env.easeIn ?? 0)
    const fall = a.length > 1 ? a[1]! : a.length ? a[0]! : (env.easeOut ?? 0)
    return smooth(0, rise, env.s ?? 0) * smooth(0, fall, (env.len ?? 0) - (env.s ?? 0))
  },
  // On a line: 1 in the middle, 0 at both ends, as a half sine. A single swell.
  swell: (env) => Math.sin(Math.PI * (env.t ?? 0)),
}

const CONSTS: Record<string, number> = { pi: Math.PI, tau: Math.PI * 2, phi: (1 + Math.sqrt(5)) / 2 }

export const FUNCTION_NAMES = Object.keys(FUNCS)

type Node = (env: Env) => number

class Parser {
  private i = 0
  readonly vars = new Set<string>()
  constructor(private readonly src: string) {}

  parse(): Node {
    const node = this.ternary()
    this.ws()
    if (this.i < this.src.length) this.fail(`unexpected "${this.src[this.i]}"`)
    return node
  }

  private fail(message: string): never {
    throw new Error(`${message} in "${this.src}"`)
  }

  private ws(): void {
    while (this.i < this.src.length && /\s/.test(this.src[this.i]!)) this.i++
  }

  private eat(token: string): boolean {
    this.ws()
    if (!this.src.startsWith(token, this.i)) return false
    // Do not read "<" out of "<=", or "=" out of "==".
    const next = this.src[this.i + token.length]
    if ((token === '<' || token === '>') && next === '=') return false
    this.i += token.length
    return true
  }

  private ternary(): Node {
    const cond = this.or()
    if (!this.eat('?')) return cond
    const yes = this.ternary()
    if (!this.eat(':')) this.fail('expected ":"')
    const no = this.ternary()
    return (env) => (cond(env) ? yes(env) : no(env))
  }

  private or(): Node {
    let left = this.and()
    while (this.eat('||')) {
      const a = left
      const b = this.and()
      left = (env) => (a(env) || b(env) ? 1 : 0)
    }
    return left
  }

  private and(): Node {
    let left = this.compare()
    while (this.eat('&&')) {
      const a = left
      const b = this.compare()
      left = (env) => (a(env) && b(env) ? 1 : 0)
    }
    return left
  }

  private compare(): Node {
    const a = this.sum()
    const ops: [string, (x: number, y: number) => boolean][] = [
      ['<=', (x, y) => x <= y],
      ['>=', (x, y) => x >= y],
      ['==', (x, y) => x === y],
      ['!=', (x, y) => x !== y],
      ['<', (x, y) => x < y],
      ['>', (x, y) => x > y],
    ]
    for (const [token, test] of ops) {
      if (this.eat(token)) {
        const b = this.sum()
        return (env) => (test(a(env), b(env)) ? 1 : 0)
      }
    }
    return a
  }

  private sum(): Node {
    let left = this.product()
    for (;;) {
      const a = left
      if (this.eat('+')) {
        const b = this.product()
        left = (env) => a(env) + b(env)
      } else if (this.eat('-')) {
        const b = this.product()
        left = (env) => a(env) - b(env)
      } else return left
    }
  }

  private product(): Node {
    let left = this.unary()
    for (;;) {
      const a = left
      if (this.eat('*')) {
        const b = this.unary()
        left = (env) => a(env) * b(env)
      } else if (this.eat('/')) {
        const b = this.unary()
        left = (env) => a(env) / b(env)
      } else if (this.eat('%')) {
        const b = this.unary()
        left = (env) => a(env) % b(env)
      } else return left
    }
  }

  private unary(): Node {
    if (this.eat('-')) {
      const a = this.unary()
      return (env) => -a(env)
    }
    if (this.eat('!')) {
      const a = this.unary()
      return (env) => (a(env) ? 0 : 1)
    }
    return this.power()
  }

  private power(): Node {
    const base = this.primary()
    if (!this.eat('^')) return base
    const exponent = this.unary()
    return (env) => Math.pow(base(env), exponent(env))
  }

  private primary(): Node {
    this.ws()
    if (this.eat('(')) {
      const inner = this.ternary()
      if (!this.eat(')')) this.fail('expected ")"')
      return inner
    }
    const rest = this.src.slice(this.i)
    const number = /^(\d+\.?\d*|\.\d+)/.exec(rest)
    if (number) {
      this.i += number[0].length
      const value = Number(number[0])
      return () => value
    }
    const word = /^[A-Za-z_][\w.]*/.exec(rest)
    if (!word) this.fail(this.i >= this.src.length ? 'unexpected end' : `unexpected "${this.src[this.i]}"`)
    const name = word[0]
    this.i += name.length
    if (this.eat('(')) {
      const fn = FUNCS[name]
      if (!fn) this.fail(`unknown function "${name}"`)
      const args: Node[] = []
      if (!this.eat(')')) {
        do args.push(this.ternary())
        while (this.eat(','))
        if (!this.eat(')')) this.fail('expected ")"')
      }
      return (env) => fn(env, ...args.map((arg) => arg(env)))
    }
    if (name in CONSTS) {
      const value = CONSTS[name]!
      return () => value
    }
    this.vars.add(name)
    return (env) => {
      const value = env[name]
      if (value === undefined) throw new Error(`"${name}" is not defined (in "${this.src}")`)
      return value
    }
  }
}

const cache = new Map<string, Compiled>()

export function compile(src: Num): Compiled {
  if (typeof src === 'number') return Object.assign(() => src, { vars: new Set<string>() })
  let compiled = cache.get(src)
  if (!compiled) {
    const parser = new Parser(src)
    const node = parser.parse()
    compiled = Object.assign((env: Env) => node(env), { vars: parser.vars })
    cache.set(src, compiled)
  }
  return compiled
}

// Evaluate, refusing anything that is not a finite number.
export function evaluate(src: Num | undefined, env: Env, fallback?: number): number {
  if (src === undefined) {
    if (fallback === undefined) throw new Error('a value is missing')
    return fallback
  }
  const value = compile(src)(env)
  if (!Number.isFinite(value)) throw new Error(`"${src}" is not a number here`)
  return value
}

// Why `src` is not a usable expression, or undefined when it is.
export function problemWith(src: Num): string | undefined {
  try {
    compile(src)
    return undefined
  } catch (err) {
    return err instanceof Error ? err.message : String(err)
  }
}
