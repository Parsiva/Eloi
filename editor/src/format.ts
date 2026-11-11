// The frame file's formatting: two-space JSON, but any value that fits on one line stays on one
// line, so sizes and small parts read at a glance and git diffs stay one line per change.
export function formatFrame(value: unknown, width = 100): string {
  return write(value, '') + '\n'

  function write(v: unknown, indent: string): string {
    const flat = inline(v)
    if (flat.length + indent.length <= width || v === null || typeof v !== 'object') return flat
    const inner = indent + '  '
    if (Array.isArray(v)) return `[\n${v.map((x) => inner + write(x, inner)).join(',\n')}\n${indent}]`
    const entries = Object.entries(v).filter(([, x]) => x !== undefined)
    return `{\n${entries.map(([k, x]) => `${inner}${JSON.stringify(k)}: ${write(x, inner)}`).join(',\n')}\n${indent}}`
  }

  function inline(v: unknown): string {
    if (v === null || typeof v !== 'object') return JSON.stringify(v)
    if (Array.isArray(v)) return `[${v.map(inline).join(', ')}]`
    const entries = Object.entries(v).filter(([, x]) => x !== undefined)
    return entries.length ? `{ ${entries.map(([k, x]) => `${JSON.stringify(k)}: ${inline(x)}`).join(', ')} }` : '{}'
  }
}
