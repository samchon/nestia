import { BenchmarkProgrammer } from "./BenchmarkProgrammer";

const FEATURES: string[] = [
  "ObjectSimple",
  "ObjectHierarchical",
  "ObjectRecursive",
  "ObjectUnionExplicit",
  "ArraySimple",
  "ArrayHierarchical",
  "ArrayRecursive",
  "ArrayRecursiveUnionExplicit",
];

const CLIENTS: BenchmarkProgrammer.ILibrary[] = [
  "nestia (express)",
  "nestia (fastify)",
  "NestJS (express)",
  "NestJS (fastify)",
  "Fastify",
].map((name) => ({
  name,
  body: (type: string) =>
    [
      `import { createPerformanceBenchmarkProgram } from "../createPerformanceBenchmarkProgram";`,
      ``,
      `createPerformanceBenchmarkProgram(`,
      `  __dirname + "/../servers/${BenchmarkProgrammer.emend(
        name,
      )}/benchmark-performance-${BenchmarkProgrammer.emend(
        name,
      )}-${type}" + __filename.substr(-3)`,
      `);`,
    ].join("\n"),
}));

const SERVERS: BenchmarkProgrammer.ILibrary[] = [
  ...["express", "fastify"].map((lib) => ({
    name: `NestJS (${lib})`,
    body: (type: string) => {
      type = `ClassValidator${type}`;
      const program: string = `createNest${lib[0].toUpperCase()}${lib.substring(
        1,
      )}PerformanceProgram`;
      const port: string = lib === "express" ? `37_011` : `37_021`;

      return [
        `import { Body, Controller, Post } from "@nestjs/common";`,
        ``,
        `import { ${type} } from "../../../../structures/class-validator/${type}";`,
        `import { ${program} } from "../${program}";`,
        ``,
        `${program}(true)(${port})(`,
        `  () => {`,
        `    @Controller()`,
        `    class NestJsController {`,
        `      @Post("performance")`,
        `      public performance(`,
        `        @Body() input: ${type}`,
        `      ): ${type} {`,
        `        return input;`,
        `      }`,
        `    }`,
        `    return NestJsController;`,
        `  },`,
        `);`,
      ].join("\n");
    },
  })),
  ...["express", "fastify"].map((lib) => ({
    name: `nestia (${lib})`,
    body: (type: string) => {
      const program: string = `createNest${lib[0].toUpperCase()}${lib.substring(
        1,
      )}PerformanceProgram`;
      const port: string = lib === "express" ? `37_012` : `37_022`;

      return [
        `import core from "@nestia/core";`,
        `import { Controller } from "@nestjs/common";`,
        ``,
        `import { Collection } from "../../../../structures/pure/Collection";`,
        `import { ${type} } from "../../../../structures/pure/${type}";`,
        `import { ${program} } from "../${program}";`,
        ``,
        `${program}(false)(${port})(() => {`,
        `  @Controller()`,
        `  class NestiaController {`,
        `    @core.TypedRoute.Post("performance")`,
        `    public performance(`,
        `      @core.TypedBody() input: Collection<${type}>`,
        `    ): Collection<${type}> {`,
        `      return input;`,
        `    }`,
        `  }`,
        `  return NestiaController;`,
        `});`,
      ].join("\n");
    },
  })),
  {
    name: "Fastify",
    body: (type: string) => {
      const program = "createAjvPerformanceProgram";
      return [
        `import typia from "typia";`,
        ``,
        `import { Collection } from "../../../../structures/pure/Collection";`,
        `import { ${type} } from "../../../../structures/pure/${type}";`,
        `import { ${program} } from "../${program}";`,
        ``,
        `${program}(37_002)(`,
        `  typia.json.application<[Collection<${type}>], "3.0">()`,
        `);`,
      ].join("\n");
    },
  },
];

BenchmarkProgrammer.generate({
  name: "performance",
  features: FEATURES,
  libraries: CLIENTS,
});
BenchmarkProgrammer.generate({
  name: "performance/servers",
  features: FEATURES,
  libraries: SERVERS,
});
