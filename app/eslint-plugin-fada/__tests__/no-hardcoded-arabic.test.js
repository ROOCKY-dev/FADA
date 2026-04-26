'use strict';

const { RuleTester } = require('eslint');
const { describe, it } = require('node:test');
const rule = require('../no-hardcoded-arabic');

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

// The rule checks filename for /components/ path segment.
// We simulate this by setting filename in each test case.

describe('fada/no-hardcoded-arabic', () => {
  it('passes valid cases and fails invalid cases', () => {
    ruleTester.run('no-hardcoded-arabic', rule, {
      valid: [
        // Arabic inside t() is OK
        {
          filename: '/project/components/MyComponent.tsx',
          code: `
            function Foo({ t }) {
              return t('مرحبا');
            }
          `,
        },
        // Arabic inside t() with method call style is OK
        {
          filename: '/project/components/AnotherComponent.tsx',
          code: `
            function Bar({ i18n }) {
              return i18n.t('الإعدادات');
            }
          `,
        },
        // Non-Arabic string in component — fine
        {
          filename: '/project/components/Safe.tsx',
          code: `
            function Safe() {
              const label = 'Hello world';
              return label;
            }
          `,
        },
        // Arabic string but NOT inside components/ — fine
        {
          filename: '/project/pages/SomePage.tsx',
          code: `
            function Page() {
              const label = 'مرحبا';
              return label;
            }
          `,
        },
      ],

      invalid: [
        // Bare Arabic string in component variable
        {
          filename: '/project/components/Bad.tsx',
          code: `
            function Bad() {
              const label = 'مرحبا بالعالم';
              return label;
            }
          `,
          errors: [{ messageId: 'noHardcodedArabic' }],
        },
        // Bare Arabic string in JSX text (as JSX expression, string literal in {})
        {
          filename: '/project/components/BadJsx.tsx',
          code: `
            function BadJsx() {
              return <span>{'الإعدادات'}</span>;
            }
          `,
          errors: [{ messageId: 'noHardcodedArabic' }],
        },
      ],
    });
  });
});
