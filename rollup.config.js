import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";
import pkg from "./package.json";

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
  }),
];

function makeConfig(env) {
  return {
    input: "src/index.ts",
    external,
    plugins: [
      replace({
        values: {
          "process.env.NODE_ENV": JSON.stringify(env),
        },
      }),
      ...plugins,
    ],
    output: {
      format: "cjs",
      file: `dist/index.${env}.cjs.js`,
      interop: true,
    },
  };
}

export default [makeConfig("development"), makeConfig("production")];
