// Invalid: bare Arabic string literal in JSX
export function InvalidComponent() {
  return <span>مرحبا بالعالم</span>;
}

// Invalid: Arabic string in a variable assignment
export function AnotherInvalid() {
  const label = 'الإعدادات';
  return <div>{label}</div>;
}
