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
    "fastify",
].map((name) => ({
    name,
    body: (type: string) =>
        [
            `import { createStringifyBenchmarkProgram } from "../createStringifyBenchmarkProgram";`,
            ``,
            `createStringifyBenchmarkProgram(`,
            `    __dirname + "/../servers/${BenchmarkProgrammer.emend(
                name,
            )}/benchmark-stringify-${BenchmarkProgrammer.emend(
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
            )}StringifyProgram`;
            const port: string = lib === "express" ? `37_011` : `37_021`;

            return [
                `import { Controller, Get } from "@nestjs/common";`,
                `import { plainToInstance } from "class-transformer";`,
                ``,
                `import { ${type} } from "../../../../structures/class-validator/${type}";`,
                `import { ${program} } from "../${program}";`,
                ``,
                `${program}(true)(${port})(`,
                `    (input: ${type}) => {`,
                `        @Controller()`,
                `        class NestJsController {`,
                `            @Get("stringify")`,
                `            public stringify(): ${type} {`,
                `                return plainToInstance(`,
                `                    ${type},`,
                `                    input,`,
                `                );`,
                `            }`,
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
            )}StringifyProgram`;
            const port: string = lib === "express" ? `37_012` : `37_022`;

            return [
                `import { Controller } from "@nestjs/common";`,
                ``,
                `import core from "@nestia/core";`,
                ``,
                `import { Collection } from "../../../../structures/pure/Collection";`,
                `import { ${type} } from "../../../../structures/pure/${type}";`,
                `import { ${program} } from "../${program}";`,
                ``,
                `${program}(false)(${port})((input: Collection<${type}>) => {`,
                `    @Controller()`,
                `    class NestiaController {`,
                `        @core.TypedRoute.Get("stringify")`,
                `        public stringify(): Collection<${type}> {`,
                `            return input;`,
                `        }`,
                `    }`,
                `    return NestiaController;`,
                `});`,
            ].join("\n");
        },
    })),
    {
        name: "fastify",
        body: (type: string) => {
            const program = "createAjvStringifyProgram";
            return [
                `import typia from "typia";`,
                ``,
                `import { Collection } from "../../../../structures/pure/Collection";`,
                `import { ${type} } from "../../../../structures/pure/${type}";`,
                `import { ${program} } from "../${program}";`,
                ``,
                `${program}(37_002)(`,
                `    typia.application<[Collection<${type}>], "ajv">()`,
                `);`,
            ].join("\n");
        },
    },
];

BenchmarkProgrammer.generate({
    name: "stringify",
    features: FEATURES,
    libraries: CLIENTS,
});
BenchmarkProgrammer.generate({
    name: "stringify/servers",
    features: FEATURES,
    libraries: SERVERS,
});
