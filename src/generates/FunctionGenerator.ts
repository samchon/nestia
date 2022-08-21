import ts from "typescript";
import { Pair } from "tstl/utility/Pair";
import { Vector } from "tstl/container/Vector";

import { IConfiguration } from "../IConfiguration";
import { IRoute } from "../structures/IRoute";

export namespace FunctionGenerator {
    export function generate(config: IConfiguration, route: IRoute): string {
        const query: IRoute.IParameter | undefined = route.parameters.find(
            (param) => param.category === "query" && param.field === undefined,
        );
        const input: IRoute.IParameter | undefined = route.parameters.find(
            (param) => param.category === "body",
        );

        return [head, body, tail]
            .map((closure) => closure(route, query, input, config))
            .filter((str) => !!str)
            .join("\n");
    }

    /* ---------------------------------------------------------
        BODY
    --------------------------------------------------------- */
    function body(
        route: IRoute,
        query: IRoute.IParameter | undefined,
        input: IRoute.IParameter | undefined,
        config: IConfiguration,
    ): string {
        // FETCH ARGUMENTS WITH REQUST BODY
        const parameters = filter_parameters(route, query);
        const fetchArguments: string[] = [
            "connection",
            `${route.name}.ENCRYPTED`,
            `${route.name}.METHOD`,
            `${route.name}.path(${parameters.map((p) => p.name).join(", ")})`,
        ];
        if (input !== undefined) {
            fetchArguments.push(input.name);
            if (config.json === true)
                fetchArguments.push(`${route.name}.stringify`);
        }

        const assertions: string =
            config.assert === true && route.parameters.length !== 0
                ? route.parameters
                      .map(
                          (param) =>
                              `    TSON.assertType<typeof ${param.name}>(${param.name});`,
                      )
                      .join("\n") + "\n\n"
                : "";

        // RETURNS WITH FINALIZATION
        return (
            "{\n" +
            assertions +
            "    return Fetcher.fetch\n" +
            "    (\n" +
            fetchArguments.map((param) => `        ${param}`).join(",\n") +
            "\n" +
            "    );\n" +
            "}"
        );
    }

    function filter_parameters(
        route: IRoute,
        query: IRoute.IParameter | undefined,
    ): IRoute.IParameter[] {
        const parameters: IRoute.IParameter[] = route.parameters.filter(
            (param) =>
                param.category === "param" ||
                (param.category === "query" && param.field !== undefined),
        );
        if (query) parameters.push(query);
        return parameters;
    }

    /* ---------------------------------------------------------
        HEAD & TAIL
    --------------------------------------------------------- */
    function head(
        route: IRoute,
        query: IRoute.IParameter | undefined,
        input: IRoute.IParameter | undefined,
        config: IConfiguration,
    ): string {
        //----
        // CONSTRUCT COMMENT
        //----
        // MAIN DESCRIPTION
        const comments: string[] = route.comments
            .map((part) => `${part.kind === "linkText" ? " " : ""}${part.text}`)
            .map((str) => str.split("\r\n").join("\n"))
            .join("")
            .split("\n")
            .filter((str, i, array) => str !== "" || i !== array.length - 1);
        if (comments.length) comments.push("");

        // FILTER TAGS (VULNERABLE PARAMETERS WOULD BE REMOVED)
        const tagList: ts.JSDocTagInfo[] = route.tags.filter(
            (tag) => tag.text !== undefined,
        );
        if (tagList.length !== 0) {
            const index: number = tagList.findIndex((t) => t.name === "param");
            if (index !== -1) {
                const capsule: Vector<ts.JSDocTagInfo> = Vector.wrap(tagList);
                capsule.insert(capsule.nth(index), {
                    name: "param",
                    text: [
                        {
                            kind: "parameterName",
                            text: "connection",
                        },
                        {
                            kind: "space",
                            text: " ",
                        },
                        {
                            kind: "text",
                            text: "connection Information of the remote HTTP(s) server with headers (+encryption password)",
                        },
                    ],
                });
            }
            comments.push(
                ...tagList.map(
                    (tag) =>
                        `@${tag.name} ${tag
                            .text!.map((elem) => elem.text)
                            .join("")}`,
                ),
                "",
            );
        }

        // COMPLETE THE COMMENT
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
                    (param === query || param === input)
                        ? `Primitive<${route.name}.${
                              param === query ? "Query" : "Input"
                          }>`
                        : param.type.name;
                return `${param.name}: ${type}`;
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
            `export function ${route.name}\n` +
            `    (\n` +
            `${parameters.map((str) => `        ${str}`).join(",\n")}\n` +
            `    ): Promise<${output}>`
        );
    }

    function tail(
        route: IRoute,
        query: IRoute.IParameter | undefined,
        input: IRoute.IParameter | undefined,
        config: IConfiguration,
    ): string | null {
        // LIST UP TYPES
        const types: Pair<string, string>[] = [];
        if (query !== undefined) types.push(new Pair("Query", query.type.name));
        if (input !== undefined) types.push(new Pair("Input", input.type.name));
        if (route.output.name !== "void")
            types.push(new Pair("Output", route.output.name));

        // PATH WITH PARAMETERS
        const parameters: IRoute.IParameter[] = filter_parameters(route, query);
        const path: string = compute_path(query, parameters, route.path);

        return (
            `export namespace ${route.name}\n` +
            "{\n" +
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
            `        request: ${input !== undefined && input.encrypted},\n` +
            `        response: ${route.encrypted},\n` +
            `    };\n` +
            "\n" +
            `    export function path(${parameters
                .map((param) => `${param.name}: ${param.type.name}`)
                .join(", ")}): string\n` +
            `    {\n` +
            `        return ${path};\n` +
            `    }\n` +
            (config.json === true &&
            (route.method === "POST" ||
                route.method === "PUT" ||
                route.method === "PATCH")
                ? `    export const stringify = (input: Input) => TSON.stringify(input);\n`
                : "") +
            "}"
        );
    }

    function compute_path(
        query: IRoute.IParameter | undefined,
        parameters: IRoute.IParameter[],
        path: string,
    ): string {
        for (const param of parameters)
            if (param.category === "param")
                path = path.replace(
                    `:${param.field}`,
                    `\${encodeURIComponent(${param.name})}`,
                );
        const queryParams: IRoute.IParameter[] = parameters.filter(
            (param) => param.category === "query" && param.field !== undefined,
        );
        if (query === undefined && queryParams.length === 0)
            return `\`${path}\``;

        const wrapper = (str: string) =>
            `\`${path}?\${new URLSearchParams(${str}).toString()}\``;
        if (query !== undefined && queryParams.length === 0)
            return wrapper(`${query.name} as any`);
        else if (query === undefined)
            return wrapper(`
        {
            ${rest_query_parameters(queryParams)}
        } as any`);
        return wrapper(`{
            ...${query.name},
            ${rest_query_parameters(queryParams)},
        } as any`);
    }

    function rest_query_parameters(parameters: IRoute.IParameter[]): string {
        return parameters
            .map((param) => param.name)
            .join(`,\n${" ".repeat(12)}`);
    }
}
