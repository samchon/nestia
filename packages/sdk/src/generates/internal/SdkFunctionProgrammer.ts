import { Pair } from "tstl/utility/Pair";

import { Escaper } from "typia/lib/utils/Escaper";

import { INestiaConfig } from "../../INestiaConfig";
import { IController } from "../../structures/IController";
import { IRoute } from "../../structures/IRoute";
import { SdkSimulationProgrammer } from "./SdkSimulationProgrammer";

export namespace SdkFunctionProgrammer {
    export const generate =
        (config: INestiaConfig) =>
        (route: IRoute): string => {
            const query: IRoute.IParameter | undefined = route.parameters.find(
                (param) =>
                    param.category === "query" && param.field === undefined,
            );
            const input: IRoute.IParameter | undefined = route.parameters.find(
                (param) => param.category === "body",
            );

            const [x, y, z] = [head, body, tail].map((closure) =>
                closure(config)(route)({ query, input }),
            );
            return `${x} ${y}\n${z}`;
        };

    /* ---------------------------------------------------------
        BODY
    --------------------------------------------------------- */
    const body =
        (config: INestiaConfig) =>
        (route: IRoute) =>
        (props: {
            query: IRoute.IParameter | undefined;
            input: IRoute.IParameter | undefined;
        }): string => {
            const textBody: boolean =
                props.input !== undefined &&
                props.input.category === "body" &&
                (props.input as IController.IBodyParameter).contentType ===
                    "text/plain";

            // FETCH ARGUMENTS WITH REQUST BODY
            const parameters = filter_parameters(route)(props.query);
            const fetchArguments: Array<string | string[]> = [
                textBody
                    ? [
                          "{",
                          "    ...connection,",
                          "    headers: {",
                          "        ...(connection.headers ?? {}),",
                          `        "Content-Type": "text/plain",`,
                          "    },",
                          "}",
                      ]
                    : "connection",
                `${route.name}.ENCRYPTED`,
                `${route.name}.METHOD`,
                `${route.name}.path(${parameters
                    .map((p) => p.name)
                    .join(", ")})`,
            ];
            if (props.input !== undefined) {
                fetchArguments.push(props.input.name);
                if (textBody) fetchArguments.push("(str) => str");
                else if (config.json === true)
                    fetchArguments.push(`${route.name}.stringify`);
            }

            const assertions: string =
                config.assert === true && route.parameters.length !== 0
                    ? route.parameters
                          .map(
                              (param) =>
                                  `    typia.assert<typeof ${param.name}>(${param.name});`,
                          )
                          .join("\n") + "\n\n"
                    : "";

            // FUNCTION CALL STATEMENT
            const caller = (awa: boolean) => {
                const random = () =>
                    [
                        `${awa ? "await " : ""}${route.name}.simulate(`,
                        `    connection,`,
                        ...route.parameters.map((p) => `    ${p.name},`),
                        `)`,
                    ]
                        .map((line, i) =>
                            i === 0 ? line : `${space(10)}${line}`,
                        )
                        .join("\n");
                const fetch = (tab: string) =>
                    [
                        `${awa ? "await " : ""}Fetcher.fetch(`,
                        fetchArguments
                            .map((param) =>
                                typeof param === "string"
                                    ? `${tab}    ${param}`
                                    : param
                                          .map((str) => `${tab}    ${str}`)
                                          .join("\n"),
                            )
                            .join(",\n") + ",",
                        `${tab})`,
                    ].join("\n");
                if (!config.simulate) return fetch(space(4));
                return (
                    `!!connection.simulate\n` +
                    `        ? ${random()}\n` +
                    `        : ${fetch(space(10))}`
                );
            };
            if (route.setHeaders.length === 0)
                return `{\n${assertions}    return ${caller(false)};\n}`;

            // SET HEADERS
            const content: string[] = [
                `{\n`,
                assertions,
                `    const output: ${route.name}.Output = ${caller(true)};\n`,
                "\n",
                `    // configure header(s)\n`,
                `    connection.headers ??= {};\n`,
            ];

            for (const header of route.setHeaders) {
                if (header.type === "assigner")
                    content.push(
                        "    ",
                        `Object.assign(connection.headers, ${access("output")(
                            header.source,
                        )});\n`,
                    );
                else
                    content.push(
                        "    ",
                        `${access("connection.headers")(
                            header.target ?? header.source,
                        )} = ${access("output")(header.source)};\n`,
                    );
            }
            content.push("\n", "    return output;\n", "}");
            return content.join("");
        };

    const filter_parameters =
        (route: IRoute) =>
        (query: IRoute.IParameter | undefined): IRoute.IParameter[] => {
            const parameters: IRoute.IParameter[] = route.parameters.filter(
                (param) =>
                    param.category === "param" ||
                    (param.category === "query" && param.field !== undefined),
            );
            if (query) parameters.push(query);
            return parameters;
        };

    const access =
        (x: string) =>
        (y: string): string =>
            y[0] === "[" ? `${x}${y}` : `${x}.${y}`;

    /* ---------------------------------------------------------
        HEAD & TAIL
    --------------------------------------------------------- */
    const head =
        (config: INestiaConfig) =>
        (route: IRoute) =>
        (props: {
            query: IRoute.IParameter | undefined;
            input: IRoute.IParameter | undefined;
        }): string => {
            //----
            // CONSTRUCT COMMENT
            //----
            // MAIN DESCRIPTION
            const comments: string[] = route.description
                ? route.description.split("\n")
                : [];

            // COMPLETE THE COMMENT
            if (!!comments.length) comments.push("");
            comments.push(
                `@controller ${route.symbol}`,
                `@path ${route.method} ${route.path}`,
                `@nestia Generated by Nestia - https://github.com/samchon/nestia`,
            );

            //----
            // FINALIZATION
            //----
            // REFORM PARAMETERS TEXT
            const parameters: string[] = [
                "connection: IConnection",
                ...route.parameters.map((param) => {
                    const type: string =
                        config.primitive !== false &&
                        (param === props.query || param === props.input)
                            ? `${route.name}.${
                                  param === props.query ? "Query" : "Input"
                              }`
                            : param.type.name;
                    return `${param.name}${param.optional ? "?" : ""}: ${type}`;
                }),
            ];

            // OUTPUT TYPE
            const output: string =
                route.output.name === "void" ? "void" : `${route.name}.Output`;

            // RETURNS WITH CONSTRUCTION
            return (
                "" +
                "/**\n" +
                comments.map((str) => ` * ${str}`).join("\n") +
                "\n" +
                " */\n" +
                `export async function ${route.name}(\n` +
                parameters.map((str) => `    ${str},\n`).join("") +
                `): Promise<${output}>`
            );
        };

    const tail =
        (config: INestiaConfig) =>
        (route: IRoute) =>
        (props: {
            query: IRoute.IParameter | undefined;
            input: IRoute.IParameter | undefined;
        }): string => {
            // LIST UP TYPES
            const types: Pair<string, string>[] = [];
            if (props.query !== undefined)
                types.push(new Pair("Query", props.query.type.name));
            if (props.input !== undefined)
                types.push(new Pair("Input", props.input.type.name));
            if (route.output.name !== "void")
                types.push(new Pair("Output", route.output.name));

            // PATH WITH PARAMETERS
            const parameters: IRoute.IParameter[] = filter_parameters(route)(
                props.query,
            );
            const path: string = compute_path({
                path: route.path,
                query: props.query,
                parameters,
            });

            return (
                `export namespace ${route.name} {\n` +
                (types.length !== 0
                    ? types
                          .map(
                              (tuple) =>
                                  `    export type ${tuple.first} = ${
                                      config.primitive !== false
                                          ? `Primitive<${tuple.second}>`
                                          : tuple.second
                                  };`,
                          )
                          .join("\n") + "\n"
                    : "") +
                "\n" +
                `    export const METHOD = "${route.method}" as const;\n` +
                `    export const PATH: string = "${route.path}";\n` +
                `    export const ENCRYPTED: Fetcher.IEncrypted = {\n` +
                `        request: ${
                    props.input !== undefined &&
                    props.input.custom === true &&
                    props.input.category === "body" &&
                    props.input.encrypted
                },\n` +
                `        response: ${route.encrypted},\n` +
                (route.status !== undefined
                    ? `        status: ${route.status},\n`
                    : "") +
                `    };\n` +
                "\n" +
                `    export const path = (${parameters
                    .map(
                        (param) =>
                            `${param.name}: ${
                                param.category === "query" &&
                                param.type.name === props.query?.type.name
                                    ? `${route.name}.Query`
                                    : param.type.name
                            }`,
                    )
                    .join(", ")}): string => {\n` +
                `${path};\n` +
                `    }\n` +
                (config.simulate === true && route.output.name !== "void"
                    ? `    export const random = (g?: Partial<typia.IRandomGenerator>): Output =>\n` +
                      `        typia.random<Output>(g);\n`
                    : "") +
                (config.simulate === true
                    ? SdkSimulationProgrammer.generate(route) + "\n"
                    : "") +
                (config.json === true &&
                route.parameters.find((param) => param.category === "body") !==
                    undefined
                    ? `    export const stringify = (input: Input) => typia.assertStringify(input);\n`
                    : "") +
                "}"
            );
        };

    const compute_path = (props: {
        query: IRoute.IParameter | undefined;
        parameters: IRoute.IParameter[];
        path: string;
    }): string => {
        for (const param of props.parameters)
            if (param.category === "param")
                props.path = props.path.replace(
                    `:${param.field}`,
                    `\${encodeURIComponent(${param.name} ?? "null")}`,
                );

        // NO QUERY PARAMETER
        const queryParams: IRoute.IParameter[] = props.parameters.filter(
            (param) => param.category === "query" && param.field !== undefined,
        );
        if (props.query === undefined && queryParams.length === 0)
            return `${space(8)}return \`${props.path}\``;

        const computeName = (str: string): string =>
            props.parameters.find((p) => p.name === str) !== undefined
                ? computeName("_" + str)
                : str;
        const variables: string = computeName("variables");
        const search: string = computeName("search");
        const encoded: string = computeName("encoded");

        const wrapper = (expr: string) =>
            [
                `const ${variables}: Record<any, any> = ${expr};`,
                `const ${search}: URLSearchParams = new URLSearchParams();`,
                `for (const [key, value] of Object.entries(${variables}))`,
                `    if (value === undefined) continue;`,
                `    else if (Array.isArray(value))`,
                `        value.forEach((elem) => ${search}.append(key, String(elem)));`,
                `    else`,
                `        ${search}.set(key, String(value));`,
                `const ${encoded}: string = ${search}.toString();`,
                `return \`${props.path}\${${encoded}.length ? \`?\${${encoded}}\` : ""}\`;`,
            ]
                .map((str) => `${space(8)}${str}`)
                .join("\n");

        if (props.query !== undefined && queryParams.length === 0)
            return wrapper(`${props.query.name} as any`);
        else if (props.query === undefined)
            return wrapper(`
        {
            ${rest_query_parameters(queryParams)}
        } as any`);

        return wrapper(`
        {
            ...${props.query.name},
            ${rest_query_parameters(queryParams)},
        } as any`);
    };

    const rest_query_parameters = (parameters: IRoute.IParameter[]): string =>
        parameters
            .map((param) =>
                param.name === param.field
                    ? param.name
                    : `${
                          Escaper.variable(param.field!)
                              ? param.field
                              : JSON.stringify(param.field)
                      }: ${param.name}`,
            )
            .join(`,\n${space(12)}`);
}

const space = (count: number) => " ".repeat(count);
