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
            ...route.parameters
                .map((p) => [
                    `assert(`,
                    `    ${message(p)}`,
                    `)(() => typia.assert(${p.name}));`,
                ])
                .flat(),
            ...(output ? returns() : []),
        ];

        return [
            `export const simulate = async (`,
            `    ${
                route.parameters.length === 0 && route.output.name === "void"
                    ? "_connection"
                    : "connection"
            }: IConnection,`,
            ...route.parameters.map((p) => `    ${p.name}: ${p.type.name},`),
            `): Promise<${output ? "Output" : "void"}> => {`,
            ...body.map((l) => `    ${l}`),
            `}`,
        ]
            .map((line) => `    ${line}`)
            .join("\n");
    };

    const message = (p: IRoute.IParameter): string => {
        if (p.category === "param")
            return `() => "URL parameter \\"${p.name}\\" is not \${exp.expected} type."`;
        else
            return `() => "Request ${
                p.category === "query" ? "query parameters are" : "body is"
            } not following the promised type."`;
    };

    const assert = (parameters: IRoute.IParameter[]): string[] => {
        return [
            `const assert =`,
            `    (message: (exp: typia.TypeGuardError) => string) =>`,
            `    <T>(task: () => T): void => {`,
            `        try {`,
            `            task()`,
            `        }`,
            `        catch (exp) {`,
            `            if (typia.is<typia.TypeGuardError>(exp))`,
            `                throw new HttpError(`,
            `                    METHOD,`,
            "                    `${connection.host}${path(" +
                parameters
                    .filter((p) => p.category !== "body")
                    .map((p) => p.name)
                    .join(", ") +
                ")}`,",
            `                    400,`,
            `                    JSON.stringify({`,
            `                        method: exp.method,`,
            `                        path: exp.path,`,
            `                        expected: exp.expected,`,
            `                        value: exp.value,`,
            `                        message: message(exp),`,
            `                    })`,
            `                );`,
            `            throw exp`,
            `        }`,
            `    };`,
        ];
    };
}
