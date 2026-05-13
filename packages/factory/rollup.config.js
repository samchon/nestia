const typescript = require("@rollup/plugin-typescript");

module.exports = {
  input: "./src/index.ts",
  output: {
    dir: "lib",
    format: "esm",
    entryFileNames: "[name].mjs",
    preserveModules: true,
    preserveModulesRoot: "src",
    sourcemap: true,
  },
  plugins: [
    typescript({
      tsconfig: "tsconfig.json",
      module: "ESNext",
      moduleResolution: "Bundler",
      target: "ESNext",
    }),
  ],
};
