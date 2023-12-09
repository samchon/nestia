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
            `import { createAssertBenchmarkProgram } from "../createAssertBenchmarkProgram";`,
            ``,
            `createAssertBenchmarkProgram(`,
            `    __dirname + "/../servers/${BenchmarkProgrammer.emend(
                name,
            )}/benchmark-assert-${BenchmarkProgrammer.emend(
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
            )}AssertProgram`;
            const port: string = lib === "express" ? `37_011` : `37_021`;

            return [
                `import { Body, Controller, Post } from "@nestjs/common";`,
                ``,
                `import { ${type} } from "../../../../structures/class-validator/${type}";`,
                `import { ${program} } from "../${program}";`,
                ``,
                `${program}(true)(${port})(`,
                `    () => {`,
                `        @Controller()`,
                `        class NestJsController {`,
                `            @Post("assert")`,
                `            public assert(@Body() _input: ${type}): void {}`,
                `        }`,
                `        return NestJsController;`,
                `    },`,
                `);`,
            ].join("\n");
        },
    })),
    ...["express", "fastify"].map((lib) => ({
        name: `nestia (${lib})`,
        body: (type: string) => {
            const program: string = `createNest${lib[0].toUpperCase()}${lib.substring(
                1,
            )}AssertProgram`;
            const port: string = lib === "express" ? `37_012` : `37_022`;

            return [
                `import { Controller, Post } from "@nestjs/common";`,
                ``,
                `import core from "@nestia/core";`,
                ``,
                `import { Collection } from "../../../../structures/pure/Collection";`,
                `import { ${type} } from "../../../../structures/pure/${type}";`,
                `import { ${program} } from "../${program}";`,
                ``,
                `${program}(false)(${port})(() => {`,
                `    @Controller()`,
                `    class NestiaController {`,
                `        @Post("assert")`,
                `        public assert(@core.TypedBody() _input: Collection<${type}>): void {}`,
                `    }`,
                `    return NestiaController;`,
                `});`,
            ].join("\n");
        },
    })),
    {
        name: "Fastify",
        body: (type: string) => {
            const program = "createAjvAssertProgram";
            return [
                `import typia from "typia";`,
                ``,
                `import { Collection } from "../../../../structures/pure/Collection";`,
                `import { ${type} } from "../../../../structures/pure/${type}";`,
                `import { ${program} } from "../${program}";`,
                ``,
                `${program}(37_002)(`,
                `    typia.json.application<[Collection<${type}>], "ajv">()`,
                `);`,
            ].join("\n");
        },
    },
];

BenchmarkProgrammer.generate({
    name: "assert",
    features: FEATURES,
    libraries: CLIENTS,
});
BenchmarkProgrammer.generate({
    name: "assert/servers",
    features: FEATURES,
    libraries: SERVERS,
});
