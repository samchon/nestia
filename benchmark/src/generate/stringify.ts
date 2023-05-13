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
    "express (nestia)",
    "express (pure)",
    "express (nestjs)",
    "fastify (nestia)",
    "fastify (pure)",
    "fastify (nestjs)",
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
    {
        name: "express (pure)",
        body: () =>
            [
                `import { createExpressServerStringifyProgram } from "../createExpressServerStringifyProgram";`,
                ``,
                `createExpressServerStringifyProgram(JSON.stringify);`,
            ].join("\n"),
    },
    {
        name: "fastify (pure)",
        body: (type: string) =>
            [
                `import typia from "typia";`,
                ``,
                `import { ${type} } from "../../../../structures/pure/${type}";`,
                `import { createFastifyServerStringifyProgram } from "../createFastifyServerStringifyProgram";`,
                ``,
                `createFastifyServerStringifyProgram(`,
                `   typia.application<[${type}[]], "ajv">()`,
                `);`,
            ].join("\n"),
    },
    ...["express", "fastify"].map((lib) => ({
        name: `${lib} (nestjs)`,
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
                `${program}(${port})(`,
                `    (input: ${type}[]) => {`,
                `        @Controller()`,
                `        class NestJsController {`,
                `            @Get("stringify")`,
                `            public stringify(): ${type}[] {`,
                `                return input.map((i) => `,
                `                    plainToInstance(`,
                `                        ${type},`,
                `                        i,`,
                `                    )`,
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
        name: `${lib} (nestia)`,
        body: (type: string) => {
            const program: string = `createNest${lib[0].toUpperCase()}${lib.substring(
                1,
            )}StringifyProgram`;
            const port: string = lib === "express" ? `37_011` : `37_022`;

            return [
                `import { Controller } from "@nestjs/common";`,
                ``,
                `import core from "@nestia/core";`,
                ``,
                `import { ${type} } from "../../../../structures/pure/${type}";`,
                `import { ${program} } from "../${program}";`,
                ``,
                `${program}(${port})((input: ${type}[]) => {`,
                `    @Controller()`,
                `    class NestiaController {`,
                `        @core.TypedRoute.Get("stringify")`,
                `        public stringify(): ${type}[] {`,
                `            return input;`,
                `        }`,
                `    }`,
                `    return NestiaController;`,
                `});`,
            ].join("\n");
        },
    })),
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
