#!/usr/bin/env node
require("ts-node").register({
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "nodenext",
    plugins: [
      { transform: "typia/lib/transform" },
      { transform: "@nestia/core/lib/transform" },
      { transform: "@nestia/sdk/lib/transform" },
    ],
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    esModuleInterop: true,
    strict: true,
  },
});
require("./index.ts");
