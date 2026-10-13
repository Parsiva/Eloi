// A tiny element builder for sandbox pages. No templating, no diffing.
type Child = Node | string | null | undefined | false

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value)
  for (const child of children) if (child) el.append(child)
  return el
}
