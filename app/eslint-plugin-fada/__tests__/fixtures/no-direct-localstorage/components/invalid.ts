// Invalid: direct localStorage access outside lib/storage/
export function badGet(key: string): string | null {
  return localStorage.getItem(key);
}

export function badSet(key: string, value: string): void {
  localStorage.setItem(key, value);
}
