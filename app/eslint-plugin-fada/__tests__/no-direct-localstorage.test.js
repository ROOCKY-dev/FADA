'use strict';

const { RuleTester } = require('eslint');
const { describe, it } = require('node:test');
const rule = require('../no-direct-localstorage');

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
  },
});

describe('fada/no-direct-localstorage', () => {
  it('passes valid cases and fails invalid cases', () => {
    ruleTester.run('no-direct-localstorage', rule, {
      valid: [
        // Inside lib/storage/ — allowed
        {
          filename: '/project/lib/storage/index.ts',
          code: `
            export function getItem(key) {
              return localStorage.getItem(key);
            }
          `,
        },
        // Inside lib/storage/ sub-folder — allowed
        {
          filename: '/project/lib/storage/watchlist.ts',
          code: `
            export function persist(key, value) {
              localStorage.setItem(key, value);
            }
          `,
        },
        // localStorage property access (not a call) — not covered by rule
        {
          filename: '/project/components/Bad.ts',
          code: `
            const store = localStorage;
          `,
        },
        // Other localStorage methods outside lib/storage/ are not banned
        {
          filename: '/project/components/Other.ts',
          code: `
            localStorage.removeItem('key');
          `,
        },
      ],

      invalid: [
        // getItem outside lib/storage/
        {
          filename: '/project/components/Comp.ts',
          code: `
            const val = localStorage.getItem('fada.v1');
          `,
          errors: [{ messageId: 'noDirectLocalStorage' }],
        },
        // setItem outside lib/storage/
        {
          filename: '/project/app/page.tsx',
          code: `
            localStorage.setItem('fada.v1', JSON.stringify(data));
          `,
          errors: [{ messageId: 'noDirectLocalStorage' }],
        },
      ],
    });
  });
});
