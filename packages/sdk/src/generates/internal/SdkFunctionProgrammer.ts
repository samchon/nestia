import { Pair } from "tstl/utility/Pair";

import { IJsDocTagInfo } from "typia/lib/schemas/metadata/IJsDocTagInfo";
import { Escaper } from "typia/lib/utils/Escaper";

import { INestiaConfig } from "../../INestiaConfig";
import { IController } from "../../structures/IController";
import { IRoute } from "../../structures/IRoute";
import { ImportDictionary } from "../../utils/ImportDictionary";
import { SdkDtoGenerator } from "./SdkDtoGenerator";
import { SdkImportWizard } from "./SdkImportWizard";
import { SdkSimulationProgrammer } from "./SdkSimulationProgrammer";
import { SdkTypeDefiner } from "./SdkTypeDefiner";

export namespace SdkFunctionProgrammer {
    export const generate =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (route: IRoute): string => {
            const [x, y, z] = [head, body, tail].map((closure) =>
                closure(config)(importer)(route)({
                    headers: route.parameters.find(
                        (param) =>
                            param.category === "headers" &&
                            param.field === undefined,
                    ),
                    query: route.parameters.find(
                        (param) =>
                            param.category === "query" &&
                            param.field === undefined,
                    ),
                    input: route.parameters.find(
                        (param) => param.category === "body",
                    ),
                }),
            );
            return `${x} ${y}\n${z}`;
        };

    /* ---------------------------------------------------------
        BODY
    --------------------------------------------------------- */
    const body =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (route: IRoute) =>
        (props: {
            query: IRoute.IParameter | undefined;
            input: IRoute.IParameter | undefined;
        }): string => {
            const encrypted: boolean =
                route.encrypted === true ||
                (props.input !== undefined &&
                    props.input.custom === true &&
                    props.input.category === "body" &&
                    props.input.encrypted === true);

            // FETCH ARGUMENTS WITH REQUST BODY
            const parameters: IRoute.IParameter[] = filter_path_parameters(
                route,
            )(props.query);
            const contentType: string | undefined =
                props.input !== undefined
                    ? (props.input as IController.IBodyParameter).encrypted
                        ? "text/plain"
                        : (props.input as IController.IBodyParameter)
                              .contentType ?? "application/json"
                    : undefined;
            const fetchArguments: Array<string | string[]> = [
                contentType
                    ? [
                          "{",
                          "    ...connection,",
                          "    headers: {",
                          "        ...(connection.headers ?? {}),",
                          `        "Content-Type": "${contentType}",`,
                          "    },",
                          "}",
                      ]
                    : "connection",
                [
                    "{",
                    `    ...${route.name}.METADATA,`,
                    `    path: ${route.name}.path(${parameters
                        .map((p) => p.name)
                        .join(", ")}),`,
                    "} as const",
                ],
            ];
            if (props.input !== undefined) {
                fetchArguments.push(props.input.name);
                if (config.json === true)
                    fetchArguments.push(`${route.name}.stringify`);
            }

            const assertions: string =
                config.assert === true &&
                route.parameters.filter(
                    (p) => p.category !== "headers" || p.field === undefined,
                ).length !== 0
                    ? route.parameters
                          .filter(
                              (p) =>
                                  p.category !== "headers" ||
                                  p.field === undefined,
                          )
                          .map(
                              (param) =>
                                  `    ${SdkImportWizard.typia(
                                      importer,
                                  )}.assert<typeof ${param.name}>(${
                                      param.name
                                  });`,
                          )
                          .join("\n") + "\n\n"
                    : "";

            // FUNCTION CALL STATEMENT
            const caller = (awa: boolean) => {
                const random = () =>
                    [
                        `${awa ? "await " : ""}${route.name}.simulate(`,
                        `    connection,`,
                        ...route.parameters
                            .filter((p) => p.category !== "headers")
                            .map((p) => `    ${p.name},`),
                        `)`,
                    ]
                        .map((line, i) =>
                            i === 0 ? line : `${space(10)}${line}`,
                        )
                        .join("\n");
                const fetch = (tab: string) =>
                    [
                        `${awa ? "await " : ""}${SdkImportWizard.Fetcher(
                            encrypted,
                        )(importer)}.${
                            config.propagate === true ? "propagate" : "fetch"
                        }(`,
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
            const headerContents = (variable: string) =>
                route.setHeaders.map((header) =>
                    header.type === "assigner"
                        ? `Object.assign(connection.headers, ${access(variable)(
                              header.source,
                          )});`
                        : `${access("connection.headers")(
                              header.target ?? header.source,
                          )} = ${access(variable)(header.source)};`,
                );
            if (config.propagate === true) {
                content.push(`    if (output.success) {\n`);
                content.push(
                    ...headerContents("output.data").map(
                        (line) => `        ${line}\n`,
                    ),
                );
                content.push(`    }\n`);
            } else
                content.push(
                    ...headerContents("output").map((line) => `    ${line}\n`),
                );
            content.push("\n", "    return output;\n", "}");
            return content.join("");
        };

    const filter_path_parameters =
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
        (importer: ImportDictionary) =>
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

            // COMMENT TAGS
            const tags: IJsDocTagInfo[] = route.jsDocTags.filter(
                (tag) =>
                    tag.name !== "param" ||
                    route.parameters
                        .filter((p) => p.category !== "headers")
                        .some((p) => p.name === tag.text?.[0]?.text),
            );
            if (tags.length !== 0) {
                const content: string[] = tags.map((t) =>
                    t.text?.length
                        ? `@${t.name} ${t.text.map((e) => e.text).join("")}`
                        : `@${t.name}`,
                );
                comments.push("", ...new Set(content));
            }

            // EXCEPTIONS
            for (const [key, value] of Object.entries(route.exceptions)) {
                if (
                    comments.some(
                        (str) =>
                            str.startsWith(`@throw ${key}`) ||
                            str.startsWith(`@throws ${key}`),
                    )
                )
                    continue;
                comments.push(
                    value.description?.length
                        ? `@throws ${key} ${value.description.split("\n")[0]}`
                        : `@throws ${key}`,
                );
            }

            // POSTFIX
            if (!!comments.length) comments.push("");
            comments.push(
                `@controller ${route.symbol.class}.${route.symbol.function}`,
                `@path ${route.method} ${route.path}`,
                `@nestia Generated by Nestia - https://github.com/samchon/nestia`,
            );

            //----
            // FINALIZATION
            //----
            // REFORM PARAMETERS TEXT
            const parameters: string[] = [
                route.parameters.some(
                    (p) => p.category === "headers" && p.field === undefined,
                )
                    ? `connection: ${SdkImportWizard.IConnection(
                          importer,
                      )}<${`${route.name}.Headers`}>`
                    : `connection: ${SdkImportWizard.IConnection(importer)}`,
                ...route.parameters
                    .filter((p) => p.category !== "headers")
                    .map((param) => {
                        const type: string =
                            config.primitive !== false &&
                            (param === props.query || param === props.input)
                                ? `${route.name}.${
                                      param === props.query ? "Query" : "Input"
                                  }`
                                : getTypeName(config)(importer)(param);
                        return `${param.name}${
                            param.optional ? "?" : ""
                        }: ${type}`;
                    }),
            ];

            // OUTPUT TYPE
            const output: string =
                config.propagate !== true && route.output.typeName === "void"
                    ? "void"
                    : `${route.name}.Output`;

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
        (importer: ImportDictionary) =>
        (route: IRoute) =>
        (props: {
            query: IRoute.IParameter | undefined;
            headers: IRoute.IParameter | undefined;
            input: IRoute.IParameter | undefined;
        }): string => {
            // LIST UP TYPES
            const types: Pair<string, string>[] = [];
            if (props.headers !== undefined)
                types.push(
                    new Pair(
                        "Headers",
                        SdkTypeDefiner.headers(config)(importer)(props.headers),
                    ),
                );
            if (props.query !== undefined)
                types.push(
                    new Pair(
                        "Query",
                        SdkTypeDefiner.query(config)(importer)(props.query),
                    ),
                );
            if (props.input !== undefined)
                types.push(
                    new Pair(
                        "Input",
                        SdkTypeDefiner.input(config)(importer)(props.input),
                    ),
                );
            if (config.propagate === true || route.output.typeName !== "void")
                types.push(
                    new Pair(
                        "Output",
                        SdkTypeDefiner.output(config)(importer)(route),
                    ),
                );

            // PATH WITH PARAMETERS
            const parameters: IRoute.IParameter[] = filter_path_parameters(
                route,
            )(props.query);
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
                                  `    export type ${tuple.first} = ${tuple.second};`,
                          )
                          .join("\n") + "\n"
                    : "") +
                "\n" +
                [
                    "export const METADATA = {",
                    `    method: "${route.method}",`,
                    `    path: "${route.path}",`,
                    ...(props.input
                        ? [
                              `request: {`,
                              `    type: "${
                                  (props.input as IController.IBodyParameter)
                                      .encrypted
                                      ? "text/plain"
                                      : (
                                            props.input as IController.IBodyParameter
                                        ).contentType ?? "application/json"
                              }",`,
                              `    encrypted: ${
                                  props.input.custom &&
                                  props.input.category === "body" &&
                                  props.input.encrypted
                              }`,
                              `},`,
                          ].map((str) => `    ${str}`)
                        : ["    request: null,"]),
                    ...(route.method !== "HEAD"
                        ? [
                              `response: {`,
                              `    type: "${route.output.contentType}",`,
                              `    encrypted: ${route.encrypted},`,
                              `},`,
                          ].map((str) => `    ${str}`)
                        : ["    response: null,"]),
                    ...(route.status
                        ? [`    status: ${route.status},`]
                        : ["    status: null,"]),
                    ...(route.output.contentType ===
                    "application/x-www-form-urlencoded"
                        ? [
                              `    parseQuery: (input: URLSearchParams) => ${SdkImportWizard.typia(
                                  importer,
                              )}.http.assertQuery<${
                                  route.output.typeName
                              }>(input),`,
                          ]
                        : []),
                    "} as const;",
                ]
                    .map((line) => `    ${line}`)
                    .join("\n") +
                "\n\n" +
                `    export const path = (${parameters
                    .map(
                        (param) =>
                            `${param.name}: ${
                                param.category === "query" &&
                                param.typeName === props.query?.typeName
                                    ? `${route.name}.Query`
                                    : getTypeName(config)(importer)(param)
                            }`,
                    )
                    .join(", ")}): string => {\n` +
                `${path};\n` +
                `    }\n` +
                (config.simulate === true && route.output.typeName !== "void"
                    ? `    export const random = (g?: Partial<${SdkImportWizard.typia(
                          importer,
                      )}.IRandomGenerator>): ${SdkTypeDefiner.responseBody(
                          config,
                      )(importer)(route)} =>\n` +
                      `        ${SdkImportWizard.typia(
                          importer,
                      )}.random<${SdkTypeDefiner.responseBody(config)(importer)(
                          route,
                      )}>(g);\n`
                    : "") +
                (config.simulate === true
                    ? SdkSimulationProgrammer.generate(config)(importer)(
                          route,
                      ) + "\n"
                    : "") +
                (config.json === true &&
                route.parameters.find((param) => param.category === "body") !==
                    undefined
                    ? `    export const stringify = (input: Input) => ${SdkImportWizard.typia(
                          importer,
                      )}.json.assertStringify(input);\n`
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
            props.parameters
                .filter((p) => p.category !== "headers")
                .find((p) => p.name === str) !== undefined
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
            .filter((param) => param.category !== "headers")
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
const getTypeName =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (p: IRoute.IParameter | IRoute.IOutput) =>
        p.metadata
            ? SdkDtoGenerator.decode(config)(importer)(p.metadata)
            : p.typeName;
