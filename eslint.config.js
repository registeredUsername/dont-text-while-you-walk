import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'android', 'ios', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // Le cœur du jeu doit rester indépendant du moteur : pas de Phaser, pas de DOM.
    files: ['src/core/**/*.ts', 'src/input/GestureRecognizer.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'phaser',
              message: 'src/core doit rester sans Phaser (voir docs/ARCHITECTURE.md).',
            },
          ],
          patterns: [
            {
              group: ['@/scenes/*', '@/render/*', '@/platform/*'],
              message: "Le cœur ne dépend pas de l'affichage.",
            },
          ],
        },
      ],
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage'],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Utiliser le RNG à graine (src/core/rng.ts).',
        },
      ],
    },
  },
  prettier,
);
