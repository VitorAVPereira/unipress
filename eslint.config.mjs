import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    '.next/**',
    '.kilo/**',
    '.superpowers/**',
    '.worktrees/**',
    'node_modules/**',
    'output/**',
    'playwright-report/**',
    'test-results/**',
    'tmp/**',
    'src/payload-types.ts',
    'src/migrations/**',
  ]),
])
