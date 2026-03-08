// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: true,
  },
}).append([
  {
    files: ["**/*.ts", "**/*.js", "**/*.vue"],
    rules: {
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn"],
    },
  },
]);
