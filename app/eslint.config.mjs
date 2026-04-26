import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Local FADA plugin — CommonJS, loaded via require()
const fadaPlugin = require('./eslint-plugin-fada/index.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * App-router files that Next.js requires as default exports.
 * The `import/no-default-export` ban does NOT apply to these.
 */
const NEXT_APP_ROUTER_FILES = [
  'app/**/page.tsx',
  'app/**/layout.tsx',
  'app/**/loading.tsx',
  'app/**/error.tsx',
  'app/**/not-found.tsx',
  'app/**/route.ts',
  'app/**/template.tsx',
  'app/**/default.tsx',
];

const eslintConfig = [
  // ─── Global ignores ───────────────────────────────────────────────────
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      // Plugin source and tests are plain JS — skip TS type-checking on them
      'eslint-plugin-fada/**',
      // Config files are not part of the TS project
      'eslint.config.mjs',
      'next.config.ts',
      'postcss.config.mjs',
      // Token generator and schema are plain ESM — not part of the TS project
      'tokens/generate.mjs',
      'tokens/schema.mjs',
    ],
  },

  // ─── Next.js core-web-vitals + typescript ────────────────────────────
  // This already includes: react, react-hooks, jsx-a11y, @next/next,
  // @typescript-eslint (basic), and import plugins.
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // ─── TypeScript strict-type-checked (flat config, rules-only layer) ──
  // We only take the rules objects from the flat config array — NOT the
  // languageOptions/plugins entries — because next/core-web-vitals already
  // registered @typescript-eslint, so re-registering it causes
  // "Cannot redefine plugin" errors.
  // The flat/strict-type-checked array has 3 items:
  //   [0] { name, languageOptions, plugins }  ← skip (already registered by Next)
  //   [1] { files, rules, name }              ← include (TS-file strict rules)
  //   [2] { name, rules }                     ← include (override rules)
  ...(tseslint.configs['flat/strict-type-checked']
    .filter((c) => c.rules !== undefined)
    .map(({ rules, files, name }) =>
      files !== undefined ? { name, files, rules } : { name, rules }
    )
  ),

  // ─── Main rules config ───────────────────────────────────────────────
  {
    plugins: {
      fada: fadaPlugin,
      import: importPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
        ecmaFeatures: { jsx: true },
      },
    },

    rules: {
      // ── §5.1 Styling — logical properties ──────────────────────────
      // Ban physical left/right in CSS-in-JS style props
      'no-restricted-syntax': [
        'error',
        // Ban marginLeft / marginRight / paddingLeft / paddingRight in JSX style={{}} objects
        {
          selector:
            'JSXAttribute[name.name="style"] ObjectExpression > Property[key.name=/^(marginLeft|marginRight|paddingLeft|paddingRight)$/]',
          message:
            'Use CSS logical properties: margin-inline-start/end, padding-inline-start/end. Physical left/right break RTL layouts.',
        },
        // Ban `left` / `right` CSS property keys in JSX style objects
        {
          selector:
            'JSXAttribute[name.name="style"] ObjectExpression > Property[key.name=/^(left|right)$/]',
          message:
            'Use CSS logical properties: inset-inline-start/end instead of left/right. Physical positioning breaks RTL layouts.',
        },
        /**
         * §5.1 — ban `text-[Npx]` Tailwind arbitrary values where N < 13.
         *
         * The spec requires this only where the element's i18n key starts with `ar.`,
         * but resolving i18n-key context from the AST alone is impractical in pure ESLint.
         * We apply a strict-superset simplification: ban text-[Npx] for N < 13 anywhere.
         * See vault/specs/2026-04-23-fada-p1-ui-ux-design.md §4.5 (Arabic minimum font size).
         */
        {
          selector:
            'JSXAttribute[name.name="className"] Literal[value=/text-\\[([0-9]+)px\\]/]',
          message:
            'Tailwind arbitrary font sizes below 13px are banned (Arabic readability minimum). Use a design-token scale class instead. See spec §4.5.',
        },
        // Ban deep imports from @tanstack/react-query internals (§5.4)
        {
          selector:
            "ImportDeclaration[source.value=/^@tanstack\\/react-query\\//]",
          message:
            'Use only the public @tanstack/react-query surface. Deep internal imports are banned.',
        },
      ],

      // ── §5.2 Localization ──────────────────────────────────────────
      'fada/no-hardcoded-arabic': 'error',

      // ── §5.3 Storage ───────────────────────────────────────────────
      'fada/no-direct-localstorage': 'error',

      // ── §5.4 React / Next ──────────────────────────────────────────
      '@typescript-eslint/strict-boolean-expressions': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // import/no-default-export — off here; enabled per-glob in components/**
      'import/no-default-export': 'off',

      // Restrict @tanstack/react-query to public surface only
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@tanstack/react-query/*'],
              message:
                'Import from @tanstack/react-query, @tanstack/react-query-persist-client, or @tanstack/query-sync-storage-persister only.',
            },
          ],
        },
      ],

      // ── §5.5 Accessibility ─────────────────────────────────────────
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'fada/logo-is-anchor': 'error',

      // ── Relax unsafe-* type-checked rules on boilerplate files ─────
      // layout.tsx and page.tsx use patterns (e.g. Readonly<{children: ReactNode}>)
      // that produce false positives from strict-type-checked without full TS
      // project context in the linter. Narrowed to app/** via override below.
      // Components/** is NOT exempted.
    },
  },

  // ─── Per-glob: narrow unsafe-* off for Next.js app-router boilerplate ─
  // Rationale (option a from pre-answered constraints): avoids touching
  // layout.tsx which belongs to Task 6.
  {
    files: ['app/**/*.tsx', 'app/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      // next/font functions return types aren't fully typed for strict mode
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },

  // ─── Per-glob: enforce no-default-export in components/** ────────────
  {
    files: ['components/**/*.ts', 'components/**/*.tsx'],
    plugins: { import: importPlugin },
    rules: {
      'import/no-default-export': 'error',
    },
  },

  // ─── Per-glob: allow default exports in Next.js app-router files ─────
  {
    files: NEXT_APP_ROUTER_FILES,
    plugins: { import: importPlugin },
    rules: {
      'import/no-default-export': 'off',
    },
  },

  // ─── Per-glob: relax type-checked rules on config files ──────────────
  {
    files: ['next.config.ts', 'postcss.config.mjs', '*.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // ─── Per-glob: relax strict type-checked rules on vendored shadcn/ui ──
  // Task 8: shadcn/ui primitives are vendored under components/ui/ — they
  // are not project code and should not be linted to strict TS rules that
  // were written for the codebase. Disable strict-type-checked overrides
  // that flag forwardRef, Readonly<>, and other idiomatic vendored patterns.
  {
    files: ['components/ui/**/*.ts', 'components/ui/**/*.tsx'],
    rules: {
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/only-throw-error': 'off',
    },
  },
];

export default eslintConfig;
