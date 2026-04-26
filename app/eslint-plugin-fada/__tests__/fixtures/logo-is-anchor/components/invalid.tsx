// Invalid: LogoMark without an anchor wrapper
export function InvalidBare() {
  return (
    <div>
      <LogoMark />
    </div>
  );
}

// Invalid: LogoMark inside a <button> (not an anchor)
export function InvalidInButton() {
  return (
    <button>
      <LogoMark />
    </button>
  );
}
