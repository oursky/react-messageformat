import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
// See https://rollupjs.org/command-line-interface/#importing-package-json
import pkg from './package.json' with { type: 'json' };

const deps = Object.keys(pkg.dependencies || {});
const peerDeps = Object.keys(pkg.peerDependencies || {});
const allDeps = deps.concat(peerDeps);

function external(id) {
  for (const d of allDeps) {
    if (id.startsWith(d)) {
      return true;
    }
  }
  return false;
}

const extensions = [".mjs", ".js", ".jsx", ".ts", ".tsx"];

const plugins = [
  resolve({
    extensions,
  }),
  json({
    preferConst: true,
    indent: "  ",
  }),
  commonjs({
    include: "node_modules/**",
  }),
  babel({
    extensions,
    exclude: ["node_modules/**"],
    babelHelpers: "bundled",
  }),
];

export default [
  {
    strictDeprecations: true,
    input: "src/index.ts",
    external,
    plugins,
    output: {
      format: "cjs",
      file: "dist/index.cjs.js",
    },
  },
  {
    strictDeprecations: true,
    input: "src/index.ts",
    external,
    plugins,
    output: {
      format: "esm",
      file: "dist/index.module.js",
    },
  },
];
