import { INestiaConfig } from "../../INestiaConfig";
import { IRoute } from "../../structures/IRoute";
import { ImportDictionary } from "../../utils/ImportDictionary";
import { SdkImportWizard } from "./SdkImportWizard";
import { SdkTypeDefiner } from "./SdkTypeDefiner";

export namespace SdkSimulationProgrammer {
    export const generate =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (route: IRoute): string => {
            const output: boolean =
                config.propagate === true || route.output.typeName !== "void";
            const body: string[] = [
                ...(route.parameters.filter((p) => p.category !== "headers")
                    .length !== 0
                    ? assert(config)(importer)(route)
                    : []),
                ...(output ? returns(config)(route) : []),
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
                                    : SdkTypeDefiner.name(config)(importer)(p)
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
        (route: IRoute): string[] => {
            const typia = SdkImportWizard.typia(importer);
            const func: string[] = [
                `const assert = ${importer.internal({
                    file: `${config.output}/utils/NestiaSimulator.ts`,
                    instance: "NestiaSimulator",
                    type: false,
                })}.assert({`,
                `    method: METADATA.method,`,
                `    host: connection.host,`,
                `    path: path(${route.parameters
                    .filter(
                        (p) => p.category === "param" || p.category === "query",
                    )
                    .map((p) => p.name)
                    .join(", ")}),`,
                `    contentType: ${JSON.stringify(route.output.contentType)},`,
                `});`,
            ];
            const individual: string[] = route.parameters
                .filter((p) => p.category !== "headers")
                .map((p) =>
                    p.category === "body"
                        ? `assert.body(() => ${typia}.assert(${p.name}));`
                        : p.category === "query"
                        ? `assert.query(() => ${typia}.assert(${p.name}));`
                        : p.category === "headers"
                        ? `assert.headers(() => ${typia}.assert(connection.headers);`
                        : `assert.param("${p.field}")(() => ${typia}.assert(${p.name}));`,
                );
            if (config.propagate !== true) return [...func, ...individual];

            return [
                ...func,
                `try {`,
                ...individual.map((l) => `    ${l}`),
                `} catch (exp) {`,
                `    if (!${typia}.is<${SdkImportWizard.HttpError(
                    importer,
                )}>(exp)) throw exp;`,
                `    return {`,
                `        success: false,`,
                `        status: exp.status,`,
                `        headers: exp.headers,`,
                `        data: exp.toJSON().message,`,
                `    } as any;`,
                `}`,
            ];
        };

    const returns =
        (config: INestiaConfig) =>
        (route: IRoute): string[] => {
            const random = (prefix: string, postfix: string) =>
                route.output.typeName === "void"
                    ? [`${prefix} undefined${postfix}`]
                    : [
                          `${prefix} random(`,
                          `    typeof connection.simulate === 'object' &&`,
                          `        connection.simulate !== null`,
                          `        ? connection.simulate`,
                          `        : undefined`,
                          `)${postfix}`,
                      ];
            if (config.propagate !== true) return random("return", ";");

            return [
                `return {`,
                `    success: true,`,
                `    status: ${
                    route.status ?? (route.method === "POST" ? 201 : 200)
                },`,
                `    headers: {`,
                `        "Content-Type": "${route.output.contentType}",`,
                `    },`,
                ...random("data:", ",").map((r) => `    ${r}`),
                `}`,
            ];
        };
}
