const typescript = require("@rollup/plugin-typescript");
const terser = require("@rollup/plugin-terser");

module.exports = {
  input: `${__dirname}/../../src/api/index.ts`,
  output: {
    dir: `${__dirname}/lib`,
    format: "esm",
    entryFileNames: "[name].mjs",
    sourcemap: true,
  },
  plugins: [
    typescript({
      tsconfig: `${__dirname}/tsconfig.json`,
      module: "ESNext",
      target: "ESNext",
    }),
    terser({
      format: {
        comments: "some",
        beautify: true,
        ecma: "2020",
      },
      compress: false,
      mangle: false,
      module: true,
    }),
  ],
};
