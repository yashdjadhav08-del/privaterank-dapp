// ESM compatibility shim for object-inspect in browser/Vite environments
export default function inspect(obj: unknown): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj === 'string') return `"${obj}"`;
  if (typeof obj === 'bigint') return `${obj.toString()}n`;
  if (typeof obj === 'symbol') return obj.toString();
  if (typeof obj === 'function') return `[Function: ${(obj as Function).name || 'anonymous'}]`;
  if (Array.isArray(obj)) return `[ ${obj.map(inspect).join(', ')} ]`;
  if (obj instanceof Uint8Array) {
    const hexPreview = Array.from(obj.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ');
    return `Uint8Array(${obj.length}) [ ${hexPreview}${obj.length > 16 ? ', ...' : ''} ]`;
  }
  try {
    return JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? v.toString() + 'n' : v));
  } catch {
    return String(obj);
  }
}

export { inspect };

