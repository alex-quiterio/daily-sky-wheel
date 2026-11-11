// Lint rules. Prettier owns formatting, so only correctness and clarity are checked here.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

// ---------- which folder may import from which ----------
// The layers, lowest first. A folder may import from itself and from the ones before it, never from one after:
//   astro  ->  lib  ->  components  ->  shell  ->  views  ->  app.tsx
// So the calculations know nothing about the page, and a shared piece never depends on a particular tab.
const LAYERS = ['astro', 'lib', 'components', 'shell', 'views'];
const TABS = ['western', 'chinese', 'vedic', 'maya', 'kabbalah', 'islamic'];
// the patterns use gitignore syntax, where a leading # starts a comment, so it is escaped
const alias = (layer) => [`\\#${layer}`, `\\#${layer}/*`];
const forbid = (group, message) => ({ group, message });

const ALIASES_ONLY = forbid(
  ['./*', '../*'],
  'Import through an alias (#astro, #lib/…, #components/…, #shell/…, #views/…), not a relative path.',
);
const NO_MARKUP = forbid(
  ['preact', 'preact/*', '\\#components/*', '\\#views/*/index.tsx'],
  "A tab's model, types and constants are plain data: no Preact and no components here.",
);
// everything above `layer`
const above = (layer) =>
  forbid(
    LAYERS.slice(LAYERS.indexOf(layer) + 1).flatMap(alias),
    `src/${layer} may not import from a layer above it (astro -> lib -> components -> shell -> views).`,
  );
const otherTabs = (tab) =>
  forbid(
    TABS.filter((t) => t !== tab).map((t) => `\\#views/${t}/*`),
    'A tab may not import from another tab. Move what they share to src/lib or src/components.',
  );
// one block per place, because a later `no-restricted-imports` replaces an earlier one rather than adding to it
const boundary = (files, patterns) => ({ files, rules: { 'no-restricted-imports': ['error', { patterns }] } });

const BOUNDARIES = [
  // the calculations: only each other and the astronomy library
  boundary(
    ['src/astro/**'],
    [
      above('astro'),
      forbid(['preact', 'preact/*'], 'src/astro has no DOM and no Preact: it is the calculation layer.'),
    ],
  ),
  boundary(
    ['test/**'],
    [forbid([...LAYERS.slice(1).flatMap(alias)], 'The tests cover the calculations: import from #astro only.')],
  ),
  boundary(['src/lib/**'], [above('lib'), ALIASES_ONLY]),
  boundary(['src/components/**'], [above('components'), ALIASES_ONLY]),
  boundary(['src/shell/**'], [above('shell'), ALIASES_ONLY]),
  ...TABS.flatMap((tab) => [
    boundary([`src/views/${tab}/**`], [otherTabs(tab), ALIASES_ONLY]),
    boundary([`src/views/${tab}/{model,types,constants}.ts`], [otherTabs(tab), ALIASES_ONLY, NO_MARKUP]),
  ]),
  boundary(['src/app.tsx'], [ALIASES_ONLY]),
  // the worker has no page: only the jobs, and the calculations behind them
  boundary(
    ['src/worker.ts'],
    [
      ALIASES_ONLY,
      forbid(
        ['preact', 'preact/*', ...['components', 'shell', 'views'].flatMap(alias)],
        'The worker runs without a page: import #lib/jobs.ts and #astro only.',
      ),
    ],
  ),
];

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Preact's hooks follow React's rules
    plugins: { 'react-hooks': hooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // an unused catch binding is how "this may fail, and that is fine" is written here
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none', ignoreRestSiblings: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
  {
    // no escape hatches anywhere
    rules: { '@typescript-eslint/no-explicit-any': 'error' },
  },
  ...BOUNDARIES,
  {
    // the service worker runs in its own global scope
    files: ['sw.js'],
    languageOptions: {
      globals: { self: 'readonly', caches: 'readonly', fetch: 'readonly', URL: 'readonly', Request: 'readonly' },
    },
  },
  prettier,
);
