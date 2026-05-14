#!/usr/bin/env node
require("ts-node").register({
  skipProject: true,
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
    ignoreDeprecations: "6.0",
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    esModuleInterop: true,
    strict: true,
  },
});
require("./index.ts");
