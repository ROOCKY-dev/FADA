// Valid: Arabic string passed to t()
export function ValidComponent({ t }: { t: (key: string) => string }) {
  return <span>{t('مرحبا')}</span>;
}

// Valid: non-Arabic string literal in component
export function AnotherValid() {
  return <div className="hello">Hello</div>;
}
