import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";

const config = [
  { ignores: [".next", "out", "next-env.d.ts"] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  eslintPluginPrettier,
];

export default config;
