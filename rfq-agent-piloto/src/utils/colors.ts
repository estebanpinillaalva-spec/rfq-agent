const enabled = process.stdout.isTTY

function wrap(code: string, text: string): string {
  return enabled ? `${code}${text}\u001b[0m` : text
}

export const color = {
  bold: (text: string) => wrap('\u001b[1m', text),
  green: (text: string) => wrap('\u001b[32m', text),
  red: (text: string) => wrap('\u001b[31m', text),
  yellow: (text: string) => wrap('\u001b[33m', text),
  cyan: (text: string) => wrap('\u001b[36m', text),
  gray: (text: string) => wrap('\u001b[90m', text),
}
