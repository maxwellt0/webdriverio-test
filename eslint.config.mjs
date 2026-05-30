import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
    {
        ignores: [
            'node_modules/**',
            'src/**', // SUT — do not modify, do not lint
            'docs/**',
            'allure-report/**', // generated Allure HTML report (minified vendor bundle)
            'allure-results/**', // raw Allure result JSON
            '.idea/**',
            '.claude/**',
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    {
        files: ['tests/**/*.ts', 'wdio.conf.ts'],
        languageOptions: {
            globals: {
                // WDIO ambient globals provided by @wdio/globals/types
                browser: 'readonly',
                $: 'readonly',
                $$: 'readonly',
                expect: 'readonly',
                // Mocha
                describe: 'readonly',
                it: 'readonly',
                before: 'readonly',
                beforeEach: 'readonly',
                after: 'readonly',
                afterEach: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
);
