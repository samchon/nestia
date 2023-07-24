import { Escaper } from "typia/lib/utils/Escaper";

import { IMigrateRoute } from "../structures/IMigrateRoute";
import { ISwaggerSchema } from "../structures/ISwaggeSchema";
import { ISwagger } from "../structures/ISwagger";
import { ISwaggerRoute } from "../structures/ISwaggerRoute";
import { JsonTypeChecker } from "../utils/JsonTypeChecker";
import { StringUtil } from "../utils/StringUtil";
import { SchemaProgrammer } from "./SchemaProgrammer";

export namespace RouteProgrammer {
    export const analyze =
        (swagger: ISwagger) =>
        (props: { path: string; method: string }) =>
        (route: ISwaggerRoute): IMigrateRoute | null => {
            const body = emplaceBodySchema(emplaceReference(swagger)("body"))(
                route.requestBody?.content,
            );
            const response = emplaceBodySchema(
                emplaceReference(swagger)("response"),
            )((route.responses?.["200"] ?? route.responses?.["201"])?.content);
            if (body === false || response === false) {
                console.log(
                    `Failed to migrate ${props.method.toUpperCase()} ${
                        props.path
                    }: @nestia/migrate supports only application/json or text/plain format yet.`,
                );
                return null;
            }

            const [headers, query] = ["header", "query"].map((type) => {
                const parameters = (route.parameters ?? []).filter(
                    (p) => p.in === type,
                );
                if (parameters.length === 0) return null;

                const objects = parameters
                    .map((p) =>
                        JsonTypeChecker.isObject(p.schema)
                            ? p.schema
                            : JsonTypeChecker.isReference(p.schema) &&
                              JsonTypeChecker.isObject(
                                  (swagger.components.schemas ?? {})[
                                      p.schema.$ref.replace(
                                          `#/components/schemas/`,
                                          ``,
                                      )
                                  ] ?? {},
                              )
                            ? p.schema
                            : null!,
                    )
                    .filter((s) => !!s);
                const primitives = parameters.filter(
                    (p) =>
                        JsonTypeChecker.isBoolean(p.schema) ||
                        JsonTypeChecker.isNumber(p.schema) ||
                        JsonTypeChecker.isInteger(p.schema) ||
                        JsonTypeChecker.isString(p.schema),
                );
                if (objects.length === 1) return objects[0];
                else if (
                    objects.length + primitives.length !==
                    parameters.length
                )
                    throw new Error(
                        `Error on nestia.migrate.RouteProgrammer.analze(): ${type} typed parameters must be only one object type - ${StringUtil.capitalize(
                            props.method,
                        )} "${props.path}".`,
                    );

                const entire: ISwaggerSchema.IObject[] = [
                    ...objects.map((o) =>
                        JsonTypeChecker.isObject(o)
                            ? o
                            : (swagger.components.schemas?.[
                                  o.$ref.replace(`#/components/schemas/`, ``)
                              ]! as ISwaggerSchema.IObject),
                    ),
                    {
                        type: "object",
                        properties: Object.fromEntries(
                            primitives.map((p) => [
                                p.name,
                                {
                                    ...p.schema,
                                    description:
                                        p.schema.description ?? p.description,
                                },
                            ]),
                        ),
                        required: primitives
                            .filter((p) => p.required)
                            .map((p) => p.name),
                    },
                ];
                return parameters.length === 0
                    ? null
                    : emplaceReference(swagger)(
                          StringUtil.pascal(`I/Api/${props.path}`) +
                              "." +
                              StringUtil.pascal(`${props.method}/${type}`),
                      )({
                          type: "object",
                          properties: Object.fromEntries([
                              ...new Map<string, ISwaggerSchema>(
                                  entire
                                      .map((o) =>
                                          Object.entries(
                                              o.properties ?? {},
                                          ).map(
                                              ([name, schema]) =>
                                                  [
                                                      name,
                                                      {
                                                          ...schema,
                                                          description:
                                                              schema.description ??
                                                              schema.description,
                                                      } as ISwaggerSchema,
                                                  ] as const,
                                          ),
                                      )
                                      .flat(),
                              ),
                          ]),
                          required: [
                              ...new Set(
                                  entire.map((o) => o.required ?? []).flat(),
                              ),
                          ],
                      });
            });

            const parameterNames: Set<string> = new Set(
                (route.parameters ?? [])
                    .filter((p) => p.in === "path")
                    .map((p) => StringUtil.normalize(p.name)),
            );
            return {
                name: "@lazy",
                path: props.path,
                method: props.method,
                headers,
                parameters: (route.parameters ?? [])
                    .filter((p) => p.in === "path")
                    .map((p) => ({
                        key: (() => {
                            let key: string = StringUtil.normalize(p.name);
                            if (Escaper.variable(key)) return key;

                            while (true) {
                                key = "_" + key;
                                if (parameterNames.has(key) === false)
                                    return key;
                            }
                        })(),
                        schema: {
                            ...p.schema,
                            description: p.schema.description ?? p.description,
                        },
                    })),
                query,
                body,
                response,
                description: describe(route),
            };
        };

    const describe = (route: ISwaggerRoute): string | undefined => {
        const content: string[] = [];
        const add = (text: string) => {
            if (!route.description || route.description.indexOf(text) === -1)
                content.push(text);
        };
        if (route.summary)
            add(
                (route.summary.endsWith(".")
                    ? route.summary
                    : route.summary + ".") + "\n",
            );
        if (route.description) {
            content.push(...route.description.split("\n"));
            if (!route.description.split("\n").at(-1)?.startsWith("@"))
                content.push("");
        }
        if (route.tags) route.tags.forEach((name) => add(`@tag ${name}`));
        if (route.deprecated) add("@deprecated");
        return content.length ? content.join("\n") : undefined;
    };

    const isNotObjectLiteral = (schema: ISwaggerSchema): boolean =>
        JsonTypeChecker.isReference(schema) ||
        JsonTypeChecker.isBoolean(schema) ||
        JsonTypeChecker.isNumber(schema) ||
        JsonTypeChecker.isString(schema) ||
        JsonTypeChecker.isUnknown(schema) ||
        (JsonTypeChecker.isAnyOf(schema) &&
            schema.anyOf.every(isNotObjectLiteral)) ||
        (JsonTypeChecker.isOneOf(schema) &&
            schema.oneOf.every(isNotObjectLiteral)) ||
        (JsonTypeChecker.isArray(schema) && isNotObjectLiteral(schema.items));

    const emplaceBodySchema =
        (emplacer: (schema: ISwaggerSchema) => ISwaggerSchema.IReference) =>
        (
            content?: ISwaggerRoute.IContent,
        ): false | null | IMigrateRoute.IBody => {
            if (!content) return null;

            const entries: [string, { schema: ISwaggerSchema }][] =
                Object.entries(content);
            const json = entries.find((e) => e[0].includes("application/json"));

            if (json) {
                const { schema } = json[1];
                return {
                    type: "application/json",
                    schema: isNotObjectLiteral(schema)
                        ? schema
                        : emplacer(schema),
                };
            }

            const text = entries.find((e) => e[0].includes("text/plain"));
            if (text) return { type: "text/plain", schema: { type: "string" } };
            return false;
        };

    const emplaceReference =
        (swagger: ISwagger) =>
        (name: string) =>
        (schema: ISwaggerSchema): ISwaggerSchema.IReference => {
            swagger.components.schemas ??= {};
            swagger.components.schemas[name] = schema;
            return { $ref: `#/components/schemas/${name}` };
        };

    export const write =
        (references: ISwaggerSchema.IReference[]) =>
        (route: IMigrateRoute): string => {
            const output: string = route.response
                ? SchemaProgrammer.write(references)(route.response.schema)
                : "void";
            const decorator: string =
                route.body?.type === "text/plain"
                    ? [`@Header("Content-Type", "text/plain")`, `@`].join("\n")
                    : "@core.TypedRoute.";
            const content: string[] = [
                ...(route.description
                    ? [
                          "/**",
                          ...route.description
                              .split("\n")
                              .map((line) => ` * ${line}`),
                          " */",
                      ]
                    : []),
                `${decorator}${StringUtil.capitalize(route.method)}${
                    route.path.length ? `(${JSON.stringify(route.path)})` : "()"
                }`,
                `public async ${route.name}(`,
                ...route.parameters.map((p) => `    ${writeParameter(p)},`),
                ...(route.query
                    ? [
                          `    @core.TypedQuery() query: ${SchemaProgrammer.write(
                              references,
                          )(route.query)}`,
                      ]
                    : []),
                ...(route.body
                    ? route.body.type === "application/json"
                        ? [
                              `    @core.TypedBody() body: ${SchemaProgrammer.write(
                                  references,
                              )(route.body.schema)},`,
                          ]
                        : [`    @core.PlainBody() body: string,`]
                    : []),
                `): Promise<${output}> {`,
                ...route.parameters.map(
                    (p) => `    ${StringUtil.normalize(p.key)};`,
                ),
                // ...(route.headers ? ["headers;"] : []),
                ...(route.query ? ["    query;"] : []),
                ...(route.body ? ["    body;"] : []),
                ...(output !== "void"
                    ? [`    return typia.random<${output}>();`]
                    : []),
                `}`,
            ];
            return content.join("\n");
        };

    const writeParameter = ({
        key,
        schema,
    }: IMigrateRoute.IParameter): string => {
        const variable = StringUtil.normalize(key);
        const format =
            JsonTypeChecker.isString(schema) &&
            (schema.format === "uuid" || schema.format === "date")
                ? schema.format
                : null;
        return `@core.TypedParam(${JSON.stringify(key)}${
            format ? `, ${JSON.stringify(format)}` : ""
        }) ${variable}: ${SchemaProgrammer.write([])(schema)}`;
    };
}