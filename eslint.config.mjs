import { defineConfig, globalIgnores } from "eslint/config"
import prettier from "eslint-config-prettier/flat"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"
import * as jsonParser from "jsonc-eslint-parser"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  prettier,
  {
    files: ["**/*.json"],
    languageOptions: {
      parser: jsonParser,
    },
  },
  {
    files: ["scripts/**/*.js", "*.config.{js,cjs,ts}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".vscode/**",
    ".turbo/**",
    "dist/**",
    "output/**",
    "tmp/**",
  ]),
])

export default eslintConfig
