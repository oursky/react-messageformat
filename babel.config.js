var plugins = [
  ["@babel/plugin-transform-typescript", { isTSX: true }],
  "@babel/plugin-proposal-class-properties",
  "@babel/plugin-transform-react-jsx",
];

const presetEnvOptions = {
  // Use .browserslist by not specifying targets and ignoreBrowserslistConfig
  // During testing, however, we want specify targets so that no polyfill is required.

  // Enable optimization https://babeljs.io/docs/en/babel-preset-env#bugfixes
  bugfixes: true,
  // Keep module syntax untouched.
  // During build, rollup handles module for us.
  // During testing, we use plugin-transform-modules-commonjs.
  modules: false,
  loose: false,
  debug: false,
  useBuiltIns: false,
};

if (process.env.NODE_ENV === "test") {
  plugins.push("@babel/plugin-transform-modules-commonjs");
  presetEnvOptions.targets = {
    node: "12",
  };
}

module.exports = {
  plugins,
  presets: [["@babel/preset-env", presetEnvOptions]],
};
