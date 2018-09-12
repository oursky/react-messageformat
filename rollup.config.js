import * as ts from "typescript";
import typescript from "rollup-plugin-typescript";
import commonjs from "rollup-plugin-commonjs";
import json from "rollup-plugin-json";
import resolve from "rollup-plugin-node-resolve";
import pkg from "./package.json";

const deps = Object.keys(pkg.dependencies || {});
const peerDeps = Object.keys(pkg.peerDependencies || {});
const allDeps = deps.concat(peerDeps);

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
  typescript({
    typescript: ts,
  }),
];

const output = [
  {
    format: "cjs",
    file: "dist/index.cjs.js",
    interop: false,
  },
  {
    format: "esm",
    file: "dist/index.esm.js",
    interop: false,
  },
];

function external(id) {
  if (id === "tslib") {
    return false;
  }
  for (const d of allDeps) {
    if (id.startsWith(d)) {
      return true;
    }
  }
  return false;
}

export default {
  input: "src/index.ts",
  external,
  plugins,
  output,
};
