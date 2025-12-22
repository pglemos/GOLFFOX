const nextCoreWebVitals = require("eslint-config-next/core-web-vitals")
const nextTypeScript = require("eslint-config-next/typescript")

module.exports = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  { ignores: ["coverage/**", "playwright-report/**", "test-results/**"] },
  {
    files: [
      "app/admin/min/page.tsx",
      "app/admin/rotas/rotas-content.tsx",
      "app/transportadora/motoristas/page.tsx",
      "app/transportadora/motoristas/ranking/page.tsx",
      "components/empresa/dashboard/control-tower-visual.tsx",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unused-vars": "error",
      "prefer-const": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/use-memo": "warn",
      "react/no-unescaped-entities": "warn",
      "@next/next/no-img-element": "warn",
      // Prevenir uso direto de console.* - usar logger estruturado
      "no-console": ["warn", {
        allow: ["warn", "error"] // Permitir apenas console.warn e console.error em casos excepcionais
      }],
      // Ordenação de imports
      "import/order": ["warn", {
        "groups": [
          "builtin",      // Node.js built-in modules
          "external",     // External libraries
          "internal",     // Internal modules (aliases @/)
          ["parent", "sibling"], // Relative imports
          "index",        // Index imports
          "type"          // Type imports
        ],
        "pathGroups": [
          {
            "pattern": "react",
            "group": "external",
            "position": "before"
          },
          {
            "pattern": "next/**",
            "group": "external",
            "position": "before"
          },
          {
            "pattern": "@/**",
            "group": "internal"
          }
        ],
        "pathGroupsExcludedImportTypes": ["react", "next"],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }],
      "import/no-relative-parent-imports": ["warn", {
        "allow": ["../..", "../../.."] // Permitir até 3 níveis para compatibilidade durante transição
      }],
    },
  },
  // Permitir console.* apenas em arquivos de teste e scripts
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "scripts/**/*.{js,ts}"],
    rules: {
      "no-console": "off",
    },
  },
]
