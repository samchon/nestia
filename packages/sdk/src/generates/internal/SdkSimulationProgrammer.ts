import { INestiaConfig } from "../../INestiaConfig";
import { IRoute } from "../../structures/IRoute";
import { ImportDictionary } from "../../utils/ImportDictionary";
import { SdkDtoGenerator } from "./SdkDtoGenerator";
import { SdkImportWizard } from "./SdkImportWizard";

export namespace SdkSimulationProgrammer {
    export const generate =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (route: IRoute): string => {
            const output: boolean = route.output.typeName !== "void";
            const returns = () => [
                `return random(`,
                `    typeof connection.simulate === 'object' &&`,
                `        connection.simulate !== null`,
                `        ? connection.simulate`,
                `        : undefined`,
                `);`,
            ];
            const body: string[] = [
                ...(route.parameters.filter((p) => p.category !== "headers")
                    .length !== 0
                    ? assert(config)(importer)(route.parameters)
                    : []),
                ...(output ? returns() : []),
            ];
            return [
                `export const simulate = async (`,
                `    ${
                    route.parameters.filter((p) => p.category !== "headers")
                        .length === 0 && route.output.typeName === "void"
                        ? "_connection"
                        : "connection"
                }: ${
                    route.parameters.some(
                        (p) =>
                            p.category === "headers" && p.field === undefined,
                    )
                        ? `${SdkImportWizard.IConnection(importer)}<${
                              route.name
                          }.Headers>`
                        : SdkImportWizard.IConnection(importer)
                },`,
                ...route.parameters
                    .filter((p) => p.category !== "headers")
                    .map(
                        (p) =>
                            `    ${p.name}: ${
                                p.category === "query" || p.category === "body"
                                    ? `${route.name}.${
                                          p.category === "query"
                                              ? "Query"
                                              : "Input"
                                      }`
                                    : getTypeName(config)(importer)(p)
                            },`,
                    ),
                `): Promise<${output ? "Output" : "void"}> => {`,
                ...body.map((l) => `    ${l}`),
                `}`,
            ]
                .map((line) => `    ${line}`)
                .join("\n");
        };

    const assert =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (parameters: IRoute.IParameter[]): string[] => {
            return [
                `const assert = ${importer.internal({
                    file: `${config.output}/utils/NestiaSimulator.ts`,
                    instance: "NestiaSimulator",
                    type: false,
                })}.assert({`,
                `    method: METADATA.method,`,
                `    host: connection.host,`,
                `    path: path(${parameters
                    .filter(
                        (p) => p.category === "param" || p.category === "query",
                    )
                    .map((p) => p.name)
                    .join(", ")})`,
                `});`,
                ...parameters
                    .filter((p) => p.category !== "headers")
                    .map((p) =>
                        p.category === "body"
                            ? `assert.body(() => ${SdkImportWizard.typia(
                                  importer,
                              )}.assert(${p.name}));`
                            : p.category === "query"
                            ? `assert.query(() => ${SdkImportWizard.typia(
                                  importer,
                              )}.assert(${p.name}));`
                            : p.category === "headers"
                            ? `assert.headers(() => ${SdkImportWizard.typia(
                                  importer,
                              )}.assert(connection.headers);` // not reachable
                            : `assert.param("${
                                  p.field
                              }")(() => ${SdkImportWizard.typia(
                                  importer,
                              )}.assert(${p.name}));`,
                    ),
            ];
        };
}

const getTypeName =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (p: IRoute.IParameter | IRoute.IOutput) =>
        p.metadata
            ? SdkDtoGenerator.decode(config)(importer)(p.metadata)
            : p.typeName;
