import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // Disable or change rules here
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
];
