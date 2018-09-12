module.exports = {
  roots: ["<rootDir>/src"],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(j|t)sx?$",
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
};
