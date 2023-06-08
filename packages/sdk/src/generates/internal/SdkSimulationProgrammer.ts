import { IRoute } from "../../structures/IRoute";

export namespace SdkSimulationProgrammer {
    export const generate = (route: IRoute): string => {
        const output: boolean = route.output.name !== "void";
        const returns = () => [
            `return typia.random<Output>(`,
            `    typeof connection.random === 'object'`,
            `    && connection.random !== null`,
            `        ? connection.random`,
            `        : undefined`,
            `);`,
        ];
        const body: string[] = [
            ...(route.parameters.length !== 0 ? assert(route.parameters) : []),
            ...(output ? returns() : []),
        ];

        return [
            `export const simulate = async (`,
            `    ${
                route.parameters.length === 0 && route.output.name === "void"
                    ? "_connection"
                    : "connection"
            }: IConnection,`,
            ...route.parameters.map(
                (p) =>
                    `    ${p.name}: ${
                        p.category === "query" || p.category === "body"
                            ? `${route.name}.${
                                  p.category === "query" ? "Query" : "Input"
                              }`
                            : p.type.name
                    },`,
            ),
            `): Promise<${output ? "Output" : "void"}> => {`,
            ...body.map((l) => `    ${l}`),
            `}`,
        ]
            .map((line) => `    ${line}`)
            .join("\n");
    };

    const assert = (parameters: IRoute.IParameter[]): string[] => [
        `const assert = NestiaSimulator.assert({`,
        `    method: METHOD,`,
        `    host: connection.host,`,
        `    path: path(${parameters
            .filter((p) => p.category !== "body")
            .map((p) => p.name)
            .join(", ")})`,
        `});`,
        ...parameters.map((p) =>
            p.category === "body"
                ? `assert.body(() => typia.assert(${p.name}));`
                : p.category === "query"
                ? `assert.query(() => typia.assert(${p.name}));`
                : `assert.param("${p.field}")("${
                      p.meta?.type ?? p.type.name
                  }")(() => typia.assert(${p.name}));`,
        ),
    ];
}
