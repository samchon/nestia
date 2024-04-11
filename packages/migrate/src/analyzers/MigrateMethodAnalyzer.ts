import { OpenApi } from "@samchon/openapi";
import { Escaper } from "typia/lib/utils/Escaper";

import { IMigrateProgram } from "../structures/IMigrateProgram";
import { IMigrateRoute } from "../structures/IMigrateRoute";
import { OpenApiTypeChecker } from "../utils/OpenApiTypeChecker";
import { StringUtil } from "../utils/StringUtil";

export namespace MigrateMethodAnalzyer {
  export const analyze =
    (props: Omit<IMigrateProgram.IProps, "dictionary">) =>
    (endpoint: { path: string; method: string }) =>
    (route: OpenApi.IOperation): IMigrateRoute | null => {
      const body = emplaceBodySchema("request")(
        emplaceReference(props.document)("body"),
      )(route.requestBody);
      const success = emplaceBodySchema("response")(
        emplaceReference(props.document)("response"),
      )(
        route.responses?.["201"] ??
          route.responses?.["200"] ??
          route.responses?.default,
      );

      const failures: string[] = [];
      if (body === false)
        failures.push(
          `supports only "application/json", "application/x-www-form-urlencoded", "multipart/form-data" and "text/plain" content type in the request body.`,
        );
      if (success === false)
        failures.push(
          `supports only "application/json", "application/x-www-form-urlencoded" and "text/plain" content type in the response body.`,
        );
      if (SUPPORTED_METHODS.has(endpoint.method.toUpperCase()) === false)
        failures.push(
          `does not support ${endpoint.method.toUpperCase()} method.`,
        );

      const [headers, query] = ["header", "query"].map((type) => {
        const parameters: OpenApi.IOperation.IParameter[] = (
          route.parameters ?? []
        ).filter((p) => p.in === type);
        if (parameters.length === 0) return null;

        const objects = parameters
          .map((p) =>
            OpenApiTypeChecker.isObject(p.schema)
              ? p.schema
              : OpenApiTypeChecker.isReference(p.schema) &&
                  OpenApiTypeChecker.isObject(
                    props.document.components.schemas[
                      p.schema.$ref.replace(`#/components/schemas/`, ``)
                    ] ?? {},
                  )
                ? p.schema
                : null!,
          )
          .filter((s) => !!s);
        const primitives = parameters.filter(
          (p) =>
            OpenApiTypeChecker.isBoolean(p.schema) ||
            OpenApiTypeChecker.isInteger(p.schema) ||
            OpenApiTypeChecker.isNumber(p.schema) ||
            OpenApiTypeChecker.isString(p.schema) ||
            OpenApiTypeChecker.isArray(p.schema),
        );
        if (objects.length === 1 && primitives.length === 0) return objects[0];
        else if (objects.length > 1) {
          failures.push(
            `${type} typed parameters must be only one object type`,
          );
          return false;
        }

        const dto: OpenApi.IJsonSchema.IObject | null = objects[0]
          ? OpenApiTypeChecker.isObject(objects[0])
            ? objects[0]
            : ((props.document.components.schemas ?? {})[
                (objects[0] as OpenApi.IJsonSchema.IReference).$ref.replace(
                  `#/components/schemas/`,
                  ``,
                )
              ] as OpenApi.IJsonSchema.IObject)
          : null;
        const entire: OpenApi.IJsonSchema.IObject[] = [
          ...objects.map((o) =>
            OpenApiTypeChecker.isObject(o)
              ? o
              : (props.document.components.schemas?.[
                  o.$ref.replace(`#/components/schemas/`, ``)
                ]! as OpenApi.IJsonSchema.IObject),
          ),
          {
            type: "object",
            properties: Object.fromEntries([
              ...primitives.map((p) => [
                p.name,
                {
                  ...p.schema,
                  description: p.schema.description ?? p.description,
                },
              ]),
              ...(dto ? Object.entries(dto.properties ?? {}) : []),
            ]),
            required: [
              ...primitives.filter((p) => p.required).map((p) => p.name!),
              ...(dto ? dto.required ?? [] : []),
            ],
          },
        ];
        return parameters.length === 0
          ? null
          : emplaceReference(props.document)(
              StringUtil.pascal(`I/Api/${endpoint.path}`) +
                "." +
                StringUtil.pascal(`${endpoint.method}/${type}`),
            )({
              type: "object",
              properties: Object.fromEntries([
                ...new Map<string, OpenApi.IJsonSchema>(
                  entire
                    .map((o) =>
                      Object.entries(o.properties ?? {}).map(
                        ([name, schema]) =>
                          [
                            name,
                            {
                              ...schema,
                              description:
                                schema.description ?? schema.description,
                            } as OpenApi.IJsonSchema,
                          ] as const,
                      ),
                    )
                    .flat(),
                ),
              ]),
              required: [
                ...new Set(entire.map((o) => o.required ?? []).flat()),
              ],
            });
      });

      const parameterNames: string[] = StringUtil.splitWithNormalization(
        endpoint.path,
      )
        .filter((str) => str[0] === "{" || str[0] === ":")
        .map((str) =>
          str[0] === "{" ? str.substring(1, str.length - 1) : str.substring(1),
        );
      if (
        parameterNames.length !==
        route.parameters.filter((p) => p.in === "path").length
      )
        failures.push(
          "number of path parameters are not matched with its full path.",
        );

      if (failures.length) {
        console.log(
          `Failed to migrate ${endpoint.method.toUpperCase()} ${endpoint.path}`,
          ...failures.map((f) => `  - ${f}`),
        );
        return null;
      }
      return {
        name: "@lazy",
        originalPath: endpoint.path,
        path: endpoint.path,
        method: endpoint.method,
        accessor: ["@lazy"],
        headers: headers
          ? {
              name: "headers",
              key: "headers",
              schema: headers,
            }
          : null,
        parameters: route.parameters
          .filter((p) => p.in === "path")
          .map((p, i) => ({
            name: parameterNames[i],
            key: (() => {
              let key: string = StringUtil.normalize(parameterNames[i]);
              if (Escaper.variable(key)) return key;
              while (true) {
                key = "_" + key;
                if (!parameterNames.some((s) => s === key)) return key;
              }
            })(),
            schema: {
              ...p!.schema,
              description: p!.schema.description ?? p!.description,
            },
          })),
        query: query
          ? {
              name: "query",
              key: "query",
              schema: query,
            }
          : null,
        body: body as IMigrateRoute.IBody | null,
        success: success as IMigrateRoute.IBody | null,
        exceptions: Object.fromEntries(
          Object.entries(route.responses ?? {})
            .filter(
              ([key]) => key !== "200" && key !== "201" && key !== "default",
            )
            .map(([key, value]) => [
              key,
              {
                description: value.description,
                schema: value.content?.["application/json"]?.schema ?? {},
              },
            ]),
        ),
        deprecated: route.deprecated ?? false,
        comment: () => describe(route),
        tags: route.tags ?? [],
      };
    };

  const describe = (route: OpenApi.IOperation): string => {
    const commentTags: string[] = [];
    const add = (text: string) => {
      if (commentTags.every((line) => line !== text)) commentTags.push(text);
    };

    let description: string = route.description ?? "";
    if (route.summary) {
      const emended: string = route.summary.endsWith(".")
        ? route.summary
        : route.summary + ".";
      if (!!description.length && !description.startsWith(route.summary))
        description = `${emended}\n${description}`;
    }
    for (const p of route.parameters)
      if (p.description) add(`@param ${p.name} ${p.description}`);
    if (route.requestBody?.description)
      add(`@param body ${route.requestBody.description}`);
    for (const security of route.security ?? [])
      for (const [name, scopes] of Object.entries(security))
        add(`@security ${[name, ...scopes].join("")}`);
    if (route.tags) route.tags.forEach((name) => add(`@tag ${name}`));
    if (route.deprecated) add("@deprecated");
    return description.length
      ? commentTags.length
        ? `${description}\n\n${commentTags.join("\n")}`
        : description
      : commentTags.join("\n");
  };

  const isNotObjectLiteral = (schema: OpenApi.IJsonSchema): boolean =>
    OpenApiTypeChecker.isReference(schema) ||
    OpenApiTypeChecker.isBoolean(schema) ||
    OpenApiTypeChecker.isNumber(schema) ||
    OpenApiTypeChecker.isString(schema) ||
    OpenApiTypeChecker.isUnknown(schema) ||
    (OpenApiTypeChecker.isOneOf(schema) &&
      schema.oneOf.every(isNotObjectLiteral)) ||
    (OpenApiTypeChecker.isArray(schema) && isNotObjectLiteral(schema.items));

  const emplaceBodySchema =
    (from: "request" | "response") =>
    (
      emplacer: (schema: OpenApi.IJsonSchema) => OpenApi.IJsonSchema.IReference,
    ) =>
    (meta?: {
      description?: string;
      content?: Record<string, OpenApi.IOperation.IMediaType>; // ISwaggerRouteBodyContent;
      "x-nestia-encrypted"?: boolean;
    }): false | null | IMigrateRoute.IBody => {
      if (!meta?.content) return null;

      const entries: [string, OpenApi.IOperation.IMediaType][] = Object.entries(
        meta.content,
      ).filter(([_, v]) => !!v);
      const json = entries.find((e) =>
        meta["x-nestia-encrypted"] === true
          ? e[0].includes("text/plain") || e[0].includes("application/json")
          : e[0].includes("application/json") || e[0].includes("*/*"),
      );
      if (json) {
        const { schema } = json[1];
        return {
          type: "application/json",
          name: "body",
          key: "body",
          schema: schema
            ? isNotObjectLiteral(schema)
              ? schema
              : emplacer(schema)
            : {},
          "x-nestia-encrypted": meta["x-nestia-encrypted"],
        };
      }

      const query = entries.find((e) =>
        e[0].includes("application/x-www-form-urlencoded"),
      );
      if (query) {
        const { schema } = query[1];
        return {
          type: "application/x-www-form-urlencoded",
          name: "body",
          key: "body",
          schema: schema
            ? isNotObjectLiteral(schema)
              ? schema
              : emplacer(schema)
            : {},
        };
      }

      const text = entries.find((e) => e[0].includes("text/plain"));
      if (text)
        return {
          type: "text/plain",
          name: "body",
          key: "body",
          schema: { type: "string" },
        };

      if (from === "request") {
        const multipart = entries.find((e) =>
          e[0].includes("multipart/form-data"),
        );
        if (multipart) {
          const { schema } = multipart[1];
          return {
            type: "multipart/form-data",
            name: "body",
            key: "body",
            schema: schema
              ? isNotObjectLiteral(schema)
                ? schema
                : emplacer(schema)
              : {},
          };
        }
      }
      return false;
    };

  const emplaceReference =
    (swagger: OpenApi.IDocument) =>
    (name: string) =>
    (schema: OpenApi.IJsonSchema): OpenApi.IJsonSchema.IReference => {
      swagger.components.schemas ??= {};
      swagger.components.schemas[name] = schema;
      return { $ref: `#/components/schemas/${name}` };
    };
}

const SUPPORTED_METHODS: Set<string> = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
]);
