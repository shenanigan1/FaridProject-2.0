export const POOL_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

export function normalizePoolCode(raw: string | null | undefined): string {
  return (raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
}
