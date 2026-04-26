// Valid: LogoMark inside <a>
export function ValidWithAnchor() {
  return (
    <a href="/">
      <LogoMark />
    </a>
  );
}

// Valid: LogoMark inside <Link>
export function ValidWithLink() {
  return (
    <Link href="/">
      <LogoMark />
    </Link>
  );
}
