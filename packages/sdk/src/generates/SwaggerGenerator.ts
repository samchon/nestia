import fs from "fs";
import NodePath from "path";
import { Singleton } from "tstl/thread/Singleton";
import { VariadicSingleton } from "tstl/thread/VariadicSingleton";
import ts from "typescript";

import typia, { IJsonApplication, IJsonComponents, IJsonSchema } from "typia";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { Metadata } from "typia/lib/metadata/Metadata";
import { ApplicationProgrammer } from "typia/lib/programmers/ApplicationProgrammer";

import { INestiaConfig } from "../INestiaConfig";
import { IRoute } from "../structures/IRoute";
import { ISwagger } from "../structures/ISwagger";
import { ISwaggerInfo } from "../structures/ISwaggerInfo";
import { ISwaggerRoute } from "../structures/ISwaggerRoute";
import { ISwaggerSecurityScheme } from "../structures/ISwaggerSecurityScheme";
import { FileRetriever } from "../utils/FileRetriever";
import { MapUtil } from "../utils/MapUtil";

export namespace SwaggerGenerator {
    export const generate =
        (checker: ts.TypeChecker) =>
        (config: INestiaConfig.ISwaggerConfig) =>
        async (routeList: IRoute[]): Promise<void> => {
            console.log("Generating Swagger Documents");

            // VALIDATE SECURITY
            validate_security(config)(routeList);

            // PREPARE ASSETS
            const parsed: NodePath.ParsedPath = NodePath.parse(config.output);
            const directory: string = NodePath.dirname(parsed.dir);
            if (fs.existsSync(directory) === false)
                try {
                    await fs.promises.mkdir(directory);
                } catch {}
            if (fs.existsSync(directory) === false)
                throw new Error(
                    `Error on NestiaApplication.swagger(): failed to create output directory: ${directory}`,
                );

            const location: string = !!parsed.ext
                ? NodePath.resolve(config.output)
                : NodePath.join(
                      NodePath.resolve(config.output),
                      "swagger.json",
                  );

            const collection: MetadataCollection = new MetadataCollection({
                replace: MetadataCollection.replace,
            });

            // CONSTRUCT SWAGGER DOCUMENTS
            const tupleList: Array<ISchemaTuple> = [];
            const swagger: ISwagger = await initialize(config);
            const pathDict: Map<
                string,
                Record<string, ISwaggerRoute>
            > = new Map();

            for (const route of routeList) {
                if (route.tags.find((tag) => tag.name === "internal")) continue;

                const path: Record<string, ISwaggerRoute> = MapUtil.take(
                    pathDict,
                    get_path(route.path, route.parameters),
                    () => ({}),
                );
                path[route.method.toLowerCase()] = generate_route(
                    config,
                    checker,
                    collection,
                    tupleList,
                    route,
                );
            }
            swagger.paths = {};
            for (const [path, routes] of pathDict) {
                swagger.paths[path] = routes;
            }

            // FILL JSON-SCHEMAS
            const application: IJsonApplication = ApplicationProgrammer.write({
                purpose: "swagger",
            })(tupleList.map(({ metadata }) => metadata));
            swagger.components = {
                ...(swagger.components ?? {}),
                ...(application.components ?? {}),
            };
            tupleList.forEach(({ schema }, index) => {
                Object.assign(schema, application.schemas[index]!);
            });

            // CONFIGURE SECURITY
            if (config.security) fill_security(config.security, swagger);

            // DO GENERATE
            await fs.promises.writeFile(
                location,
                JSON.stringify(swagger, null, 2),
                "utf8",
            );
        };

    const validate_security =
        (config: INestiaConfig.ISwaggerConfig) =>
        (routeList: IRoute[]): void | never => {
            const securityMap: Map<
                string,
                { scheme: ISwaggerSecurityScheme; scopes: Set<string> }
            > = new Map();
            for (const [key, value] of Object.entries(config.security ?? {}))
                securityMap.set(key, {
                    scheme: emend_security(value),
                    scopes:
                        value.type === "oauth2"
                            ? new Set([
                                  ...Object.keys(
                                      value.flows.authorizationCode?.scopes ??
                                          {},
                                  ),
                                  ...Object.keys(
                                      value.flows.implicit?.scopes ?? {},
                                  ),
                                  ...Object.keys(
                                      value.flows.password?.scopes ?? {},
                                  ),
                                  ...Object.keys(
                                      value.flows.clientCredentials?.scopes ??
                                          {},
                                  ),
                              ])
                            : new Set(),
                });

            const validate =
                (reporter: (str: string) => void) =>
                (key: string, scopes: string[]) => {
                    const security = securityMap.get(key);
                    if (security === undefined)
                        return reporter(
                            `target security scheme "${key}" does not exists.`,
                        );
                    else if (scopes.length === 0) return;
                    else if (security.scheme.type !== "oauth2")
                        return reporter(
                            `target security scheme "${key}" is not "oauth2" type, but you've configured the scopes.`,
                        );
                    for (const s of scopes)
                        if (security.scopes.has(s) === false)
                            reporter(
                                `target security scheme "${key}" does not have a specific scope "${s}".`,
                            );
                };

            const violations: string[] = [];
            for (const route of routeList)
                for (const record of route.security)
                    for (const [key, scopes] of Object.entries(record))
                        validate((str) =>
                            violations.push(
                                `  - ${str} (${route.symbol} at "${route.location}")`,
                            ),
                        )(key, scopes);

            if (violations.length)
                throw new Error(
                    `Error on NestiaApplication.swagger(): invalid security specification. Check your "nestia.config.ts" file's "swagger.security" property, or each controller methods.\n` +
                        `\n` +
                        `List of violations:\n` +
                        violations.join("\n"),
                );
        };

    /* ---------------------------------------------------------
        INITIALIZERS
    --------------------------------------------------------- */
    const initialize = async (
        config: INestiaConfig.ISwaggerConfig,
    ): Promise<ISwagger> => {
        const pack = new Singleton(
            async (): Promise<Partial<ISwaggerInfo> | null> => {
                const location: string | null = await FileRetriever.file(
                    "package.json",
                )(process.cwd());
                if (location === null) return null;

                try {
                    const content: string = await fs.promises.readFile(
                        location,
                        "utf8",
                    );
                    const data = typia.assertParse<{
                        name?: string;
                        version?: string;
                        description?: string;
                        license?:
                            | string
                            | {
                                  type: string;
                                  /**
                                   * @format url
                                   */
                                  url: string;
                              };
                    }>(content);
                    return {
                        title: data.name,
                        version: data.version,
                        description: data.description,
                        license: data.license
                            ? typeof data.license === "string"
                                ? { name: data.license }
                                : typeof data.license === "object"
                                ? {
                                      name: data.license.type,
                                      url: data.license.url,
                                  }
                                : undefined
                            : undefined,
                    };
                } catch {
                    return null;
                }
            },
        );

        return {
            openapi: "3.0.1",
            servers: config.servers ?? [
                {
                    url: "https://github.com/samchon/nestia",
                    description: "insert your server url",
                },
            ],
            info: {
                ...(config.info ?? {}),
                version:
                    config.info?.version ??
                    (await pack.get())?.version ??
                    "0.1.0",
                title:
                    config.info?.title ??
                    (await pack.get())?.title ??
                    "Swagger Documents",
                description:
                    config.info?.description ??
                    (await pack.get())?.description ??
                    "Generated by nestia - https://github.com/samchon/nestia",
                license: config.info?.license ?? (await pack.get())?.license,
            },
            paths: {},
            components: {},
        };
    };

    function get_path(path: string, parameters: IRoute.IParameter[]): string {
        const filtered: IRoute.IParameter[] = parameters.filter(
            (param) => param.category === "param" && !!param.field,
        );
        for (const param of filtered)
            path = path.replace(`:${param.field}`, `{${param.field}}`);
        return path;
    }

    function generate_route(
        config: INestiaConfig.ISwaggerConfig,
        checker: ts.TypeChecker,
        collection: MetadataCollection,
        tupleList: Array<ISchemaTuple>,
        route: IRoute,
    ): ISwaggerRoute {
        const bodyParam = route.parameters.find(
            (param) => param.category === "body",
        );

        const getTagTexts = (name: string) =>
            route.tags
                .filter(
                    (tag) =>
                        tag.name === name &&
                        tag.text &&
                        tag.text.find(
                            (elem) => elem.kind === "text" && elem.text.length,
                        ) !== undefined,
                )
                .map(
                    (tag) =>
                        tag.text!.find((elem) => elem.kind === "text")!.text,
                );

        const description: string | undefined = route.description?.length
            ? route.description
            : undefined;
        const summary: string | undefined = (() => {
            if (description === undefined) return undefined;

            const [explicit] = getTagTexts("summary");
            if (explicit?.length) return explicit;

            const index: number = description.indexOf(".");
            if (index <= 0) return undefined;

            const content: string = description.substring(0, index).trim();
            return content.length ? content : undefined;
        })();
        const deprecated = route.tags.find((tag) => tag.name === "deprecated");

        return {
            deprecated: deprecated ? true : undefined,
            tags: getTagTexts("tag"),
            parameters: route.parameters
                .filter((param) => param.category !== "body")
                .map((param) =>
                    generate_parameter(
                        config,
                        checker,
                        collection,
                        tupleList,
                        route,
                        param,
                    ),
                )
                .flat(),
            requestBody: bodyParam
                ? generate_request_body(
                      checker,
                      collection,
                      tupleList,
                      route,
                      bodyParam,
                  )
                : undefined,
            responses: generate_response_body(
                checker,
                collection,
                tupleList,
                route,
            ),
            summary,
            description,
            security: route.security.length ? route.security : undefined,
            "x-nestia-namespace": [
                ...route.path
                    .split("/")
                    .filter((str) => str.length && str[0] !== ":"),
                route.name,
            ].join("."),
            "x-nestia-jsDocTags": route.tags,
            "x-nestia-method": route.method,
        };
    }

    function fill_security(
        security: Required<INestiaConfig.ISwaggerConfig>["security"],
        swagger: ISwagger,
    ): void {
        swagger.components.securitySchemes = {};
        for (const [key, value] of Object.entries(security))
            swagger.components.securitySchemes[key] = emend_security(value);
    }

    function emend_security(
        input: ISwaggerSecurityScheme,
    ): ISwaggerSecurityScheme {
        if (input.type === "apiKey")
            return {
                ...input,
                in: input.in ?? "header",
                name: input.name ?? "Authorization",
            };
        return input;
    }

    /* ---------------------------------------------------------
        REQUEST & RESPONSE
    --------------------------------------------------------- */
    function generate_parameter(
        config: INestiaConfig.ISwaggerConfig,
        checker: ts.TypeChecker,
        collection: MetadataCollection,
        tupleList: Array<ISchemaTuple>,
        route: IRoute,
        parameter: IRoute.IParameter,
    ): ISwaggerRoute.IParameter[] {
        const schema: IJsonSchema | null = generate_schema(
            checker,
            collection,
            tupleList,
            parameter.type.type,
        );
        if (schema === null)
            throw new Error(
                `Error on NestiaApplication.swagger(): invalid parameter type on ${route.symbol}#${parameter.name}`,
            );
        else if (
            parameter.custom &&
            parameter.category === "param" &&
            !!parameter.meta &&
            (parameter.meta.type === "date" ||
                parameter.meta.type === "uuid") &&
            schema !== null
        ) {
            const string: IJsonSchema.IString = schema as IJsonSchema.IString;
            string.format = parameter.meta.type;
        } else if (
            config.decompose === true &&
            parameter.category === "query"
        ) {
            const metadata: Metadata = MetadataFactory.analyze(checker)({
                resolve: true,
                constant: true,
                absorb: true,
                validate: (meta) => {
                    if (meta.atomics.find((str) => str === "bigint"))
                        throw new Error(NO_BIGIT);
                },
            })(collection)(parameter.type.type);
            if (
                metadata.size() === 1 &&
                metadata.objects.length === 1 &&
                metadata.objects[0].properties.every(
                    (prop) =>
                        prop.key.size() &&
                        prop.key.constants.length === 1 &&
                        prop.key.constants[0].type === "string" &&
                        route.parameters.every(
                            (param) =>
                                param.name !== prop.key.constants[0].values[0],
                        ),
                )
            ) {
                const app: IJsonApplication = ApplicationProgrammer.write({
                    purpose: "swagger",
                })([metadata]);
                const top = Object.values(app.components.schemas ?? {})[0];

                if (typia.is<IJsonComponents.IObject>(top))
                    return Object.entries(top.properties).map(
                        ([key, value]) => ({
                            name: key,
                            in: "query",
                            schema: value,
                            required: top.required?.includes(key) ?? false,
                            description: value.description,
                        }),
                    );
            }
        } else if (
            config.decompose === true &&
            parameter.category === "headers"
        ) {
            const metadata: Metadata = MetadataFactory.analyze(checker)({
                resolve: true,
                constant: true,
                absorb: true,
                validate: (meta) => {
                    if (meta.atomics.find((str) => str === "bigint"))
                        throw new Error(NO_BIGIT);
                },
            })(collection)(parameter.type.type);
            if (
                metadata.size() === 1 &&
                metadata.objects.length === 1 &&
                metadata.objects[0].properties.every(
                    (prop) =>
                        prop.key.size() &&
                        prop.key.constants.length === 1 &&
                        prop.key.constants[0].type === "string" &&
                        route.parameters.every(
                            (param) =>
                                param.name !== prop.key.constants[0].values[0],
                        ),
                )
            ) {
                const app: IJsonApplication = ApplicationProgrammer.write({
                    purpose: "swagger",
                })([metadata]);
                const top = Object.values(app.components.schemas ?? {})[0];

                if (typia.is<IJsonComponents.IObject>(top))
                    return Object.entries(top.properties).map(
                        ([key, value]) => ({
                            name: key,
                            in: "header",
                            schema: value,
                            required: top.required?.includes(key) ?? false,
                            description: value.description,
                        }),
                    );
            }
        }

        return [
            {
                name: parameter.field,
                in:
                    parameter.category === "param"
                        ? "path"
                        : parameter.category === "headers"
                        ? "header"
                        : parameter.category,
                description:
                    get_parametric_description(
                        route,
                        "param",
                        parameter.name,
                    ) || "",
                schema,
                required: required(parameter.type.type),
            },
        ];
    }

    function generate_request_body(
        checker: ts.TypeChecker,
        collection: MetadataCollection,
        tupleList: Array<ISchemaTuple>,
        route: IRoute,
        parameter: IRoute.IParameter,
    ): ISwaggerRoute.IRequestBody {
        const schema: IJsonSchema | null = generate_schema(
            checker,
            collection,
            tupleList,
            parameter.type.type,
        );
        if (schema === null)
            throw new Error(
                `Error on NestiaApplication.sdk(): invalid request body type on ${route.symbol}.`,
            );
        else if (parameter.category !== "body")
            throw new Error("Unreachable code.");

        const contentType = parameter.custom
            ? parameter.contentType
            : "application/json";

        return {
            description:
                warning
                    .get(parameter.custom && parameter.encrypted)
                    .get("request") +
                (get_parametric_description(route, "param", parameter.name) ??
                    ""),
            content: {
                [contentType]: {
                    schema,
                },
            },
            required: true,
            "x-nestia-encrypted": parameter.custom && parameter.encrypted,
        };
    }

    function generate_response_body(
        checker: ts.TypeChecker,
        collection: MetadataCollection,
        tupleList: Array<ISchemaTuple>,
        route: IRoute,
    ): ISwaggerRoute.IResponseBody {
        // OUTPUT WITH SUCCESS STATUS
        const status: string =
            route.status !== undefined
                ? String(route.status)
                : route.method === "GET" || route.method === "DELETE"
                ? "200"
                : "201";
        const schema: IJsonSchema | null = generate_schema(
            checker,
            collection,
            tupleList,
            route.output.type,
        );
        const success: ISwaggerRoute.IResponseBody = {
            [status]: {
                description:
                    warning.get(route.encrypted).get("response", route.method) +
                    (get_parametric_description(route, "return") ??
                        get_parametric_description(route, "returns") ??
                        ""),
                content:
                    schema === null || route.output.name === "void"
                        ? undefined
                        : {
                              [route.output.contentType]: {
                                  schema,
                              },
                          },
                "x-nestia-encrypted": route.encrypted,
            },
        };

        // EXCEPTION STATUSES
        const exceptions: ISwaggerRoute.IResponseBody = Object.fromEntries(
            route.tags
                .filter(
                    (tag) =>
                        (tag.name === "throw" || tag.name === "throws") &&
                        tag.text &&
                        tag.text.find(
                            (elem) =>
                                elem.kind === "text" &&
                                isNaN(
                                    Number(
                                        elem.text
                                            .split(" ")
                                            .map((str) => str.trim())[0],
                                    ),
                                ) === false,
                        ) !== undefined,
                )
                .map((tag) => {
                    const text: string = tag.text!.find(
                        (elem) => elem.kind === "text",
                    )!.text;
                    const elements: string[] = text
                        .split(" ")
                        .map((str) => str.trim());

                    return [
                        elements[0],
                        {
                            description: elements.slice(1).join(" "),
                        },
                    ];
                }),
        );
        return { ...exceptions, ...success };
    }

    /* ---------------------------------------------------------
        UTILS
    --------------------------------------------------------- */
    function generate_schema(
        checker: ts.TypeChecker,
        collection: MetadataCollection,
        tupleList: Array<ISchemaTuple>,
        type: ts.Type,
    ): IJsonSchema | null {
        const metadata: Metadata = MetadataFactory.analyze(checker)({
            resolve: true,
            constant: true,
            absorb: false,
            validate: (meta) => {
                if (meta.atomics.find((str) => str === "bigint"))
                    throw new Error(NO_BIGIT);
            },
        })(collection)(type);
        if (metadata.empty() && metadata.nullable === false) return null;

        const schema: IJsonSchema = {} as IJsonSchema;
        tupleList.push({ metadata, schema });
        return schema;
    }

    function get_parametric_description(
        route: IRoute,
        tagName: string,
        parameterName?: string,
    ): string | undefined {
        const parametric: (elem: ts.JSDocTagInfo) => boolean = parameterName
            ? (tag) =>
                  tag.text!.find(
                      (elem) =>
                          elem.kind === "parameterName" &&
                          elem.text === parameterName,
                  ) !== undefined
            : () => true;

        const tag: ts.JSDocTagInfo | undefined = route.tags.find(
            (tag) => tag.name === tagName && tag.text && parametric(tag),
        );
        return tag && tag.text
            ? tag.text.find((elem) => elem.kind === "text")?.text
            : undefined;
    }
}

const required = (type: ts.Type): boolean => {
    if (type.isUnion()) return type.types.every((type) => required(type));
    const obstacle = (other: ts.TypeFlags) => (type.getFlags() & other) === 0;
    return (
        obstacle(ts.TypeFlags.Undefined) &&
        obstacle(ts.TypeFlags.Never) &&
        obstacle(ts.TypeFlags.Void) &&
        obstacle(ts.TypeFlags.VoidLike)
    );
};

const warning = new VariadicSingleton((encrypted: boolean) => {
    if (encrypted === false) return new Singleton(() => "");

    return new VariadicSingleton(
        (type: "request" | "response", method?: string) => {
            const summary =
                type === "request"
                    ? "Request body must be encrypted."
                    : "Response data have been encrypted.";

            const component =
                type === "request"
                    ? "[EncryptedBody](https://github.com/samchon/@nestia/core#encryptedbody)"
                    : `[EncryptedRoute.${method![0].toUpperCase()}.${method!
                          .substring(1)
                          .toLowerCase()}](https://github.com/samchon/@nestia/core#encryptedroute)`;

            return `## Warning
${summary}

The ${type} body data would be encrypted as "AES-128(256) / CBC mode / PKCS#5 Padding / Base64 Encoding", through the ${component} component.

Therefore, just utilize this swagger editor only for referencing. If you need to call the real API, using [SDK](https://github.com/samchon/nestia#software-development-kit) would be much better.

-----------------

`;
        },
    );
});

interface ISchemaTuple {
    metadata: Metadata;
    schema: IJsonSchema;
}

const NO_BIGIT = "Error on typia.application(): does not allow bigint type.";
