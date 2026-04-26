'use strict';

const { RuleTester } = require('eslint');
const { describe, it } = require('node:test');
const rule = require('../logo-is-anchor');

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('fada/logo-is-anchor', () => {
  it('passes valid cases and fails invalid cases', () => {
    ruleTester.run('logo-is-anchor', rule, {
      valid: [
        // LogoMark directly inside <a>
        {
          filename: '/project/components/Header.tsx',
          code: `
            function Header() {
              return (
                <a href="/">
                  <LogoMark />
                </a>
              );
            }
          `,
        },
        // LogoMark inside <Link> (next/link)
        {
          filename: '/project/components/Nav.tsx',
          code: `
            function Nav() {
              return (
                <Link href="/">
                  <LogoMark />
                </Link>
              );
            }
          `,
        },
        // LogoMark inside <a> nested in other elements
        {
          filename: '/project/components/Sidebar.tsx',
          code: `
            function Sidebar() {
              return (
                <nav>
                  <div className="logo-wrapper">
                    <a href="/">
                      <LogoMark />
                    </a>
                  </div>
                </nav>
              );
            }
          `,
        },
        // No LogoMark at all — no violation
        {
          filename: '/project/components/Other.tsx',
          code: `
            function Other() {
              return <div>Hello</div>;
            }
          `,
        },
      ],

      invalid: [
        // LogoMark inside <div> — no anchor
        {
          filename: '/project/components/BadHeader.tsx',
          code: `
            function BadHeader() {
              return (
                <div>
                  <LogoMark />
                </div>
              );
            }
          `,
          errors: [{ messageId: 'logoNotAnchor' }],
        },
        // LogoMark inside <button> — not an anchor
        {
          filename: '/project/components/BadNav.tsx',
          code: `
            function BadNav() {
              return (
                <button onClick={goHome}>
                  <LogoMark />
                </button>
              );
            }
          `,
          errors: [{ messageId: 'logoNotAnchor' }],
        },
      ],
    });
  });
});
