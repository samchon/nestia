import typia from "typia";
import { Escaper } from "typia/lib/utils/Escaper";

import { IMigrateProgram } from "../structures/IMigrateProgram";
import { IMigrateRoute } from "../structures/IMigrateRoute";
import { ISwagger } from "../structures/ISwagger";
import { ISwaggerRoute } from "../structures/ISwaggerRoute";
import { ISwaggerRouteBodyContent } from "../structures/ISwaggerRouteBodyContent";
import { ISwaggerRouteParameter } from "../structures/ISwaggerRouteParameter";
import { ISwaggerRouteResponse } from "../structures/ISwaggerRouteResponse";
import { ISwaggerSchema } from "../structures/ISwaggerSchema";
import { StringUtil } from "../utils/StringUtil";
import { SwaggerComponentsExplorer } from "../utils/SwaggerComponentsExplorer";
import { SwaggerTypeChecker } from "../utils/SwaggerTypeChecker";

export namespace MigrateMethodAnalzyer {
  export const analyze =
    (props: Omit<IMigrateProgram.IProps, "dictionary">) =>
    (endpoint: { path: string; method: string }) =>
    (route: ISwaggerRoute): IMigrateRoute | null => {
      const body = emplaceBodySchema("request")(
        emplaceReference(props.swagger)("body"),
      )(route.requestBody);
      const success = emplaceBodySchema("response")(
        emplaceReference(props.swagger)("response"),
      )(
        (() => {
          const response =
            route.responses?.["201"] ??
            route.responses?.["200"] ??
            route.responses?.default;
          if (response === undefined) return undefined;
          return (
            SwaggerComponentsExplorer.getResponse(props.swagger.components)(
              response,
            ) ?? undefined
          );
        })(),
      );

      const failures: string[] = [];
      for (const p of route.parameters ?? [])
        if (
          SwaggerComponentsExplorer.getParameter(props.swagger.components)(
            p,
          ) === null
        )
          failures.push(
            `parameter "${(p as ISwaggerRouteParameter.IReference).$ref}" is not defined in "components.parameters".`,
          );
      for (const value of Object.values(route.responses ?? {}))
        if (
          SwaggerComponentsExplorer.getResponse(props.swagger.components)(
            value,
          ) === null
        )
          failures.push(
            `response "${(value as ISwaggerRouteResponse.IReference).$ref}" is not defined in "components.responses".`,
          );
      if (
        route.requestBody &&
        SwaggerComponentsExplorer.getRequestBody(props.swagger.components)(
          route.requestBody,
        ) === null
      )
        failures.push(
          `requestBody "${(route.requestBody as ISwaggerRouteParameter.IReference).$ref}" is not defined in "components.requestBodies".`,
        );
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
        const parameters: ISwaggerRouteParameter[] = (route.parameters ?? [])
          .filter(
            (p) =>
              SwaggerComponentsExplorer.getParameter(props.swagger.components)(
                p,
              )?.in === type,
          )
          .map(
            (p) =>
              SwaggerComponentsExplorer.getParameter(props.swagger.components)(
                p,
              )!,
          );
        if (parameters.length === 0) return null;

        const objects = parameters
          .map((p) =>
            SwaggerTypeChecker.isObject(p.schema)
              ? p.schema
              : SwaggerTypeChecker.isReference(p.schema) &&
                  SwaggerTypeChecker.isObject(
                    (props.swagger.components.schemas ?? {})[
                      p.schema.$ref.replace(`#/components/schemas/`, ``)
                    ] ?? {},
                  )
                ? p.schema
                : null!,
          )
          .filter((s) => !!s);
        const primitives = parameters.filter(
          (p) =>
            SwaggerTypeChecker.isBoolean(p.schema) ||
            SwaggerTypeChecker.isNumber(p.schema) ||
            SwaggerTypeChecker.isInteger(p.schema) ||
            SwaggerTypeChecker.isString(p.schema) ||
            SwaggerTypeChecker.isArray(p.schema),
        );
        if (objects.length === 1 && primitives.length === 0) return objects[0];
        else if (objects.length > 1) {
          failures.push(
            `${type} typed parameters must be only one object type`,
          );
          return false;
        }

        const dto: ISwaggerSchema.IObject | null = objects[0]
          ? SwaggerTypeChecker.isObject(objects[0])
            ? objects[0]
            : ((props.swagger.components.schemas ?? {})[
                (objects[0] as ISwaggerSchema.IReference).$ref.replace(
                  `#/components/schemas/`,
                  ``,
                )
              ] as ISwaggerSchema.IObject)
          : null;
        const entire: ISwaggerSchema.IObject[] = [
          ...objects.map((o) =>
            SwaggerTypeChecker.isObject(o)
              ? o
              : (props.swagger.components.schemas?.[
                  o.$ref.replace(`#/components/schemas/`, ``)
                ]! as ISwaggerSchema.IObject),
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
          : emplaceReference(props.swagger)(
              StringUtil.pascal(`I/Api/${endpoint.path}`) +
                "." +
                StringUtil.pascal(`${endpoint.method}/${type}`),
            )({
              type: "object",
              properties: Object.fromEntries([
                ...new Map<string, ISwaggerSchema>(
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
                            } as ISwaggerSchema,
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
        (route.parameters ?? []).filter(
          (p) =>
            SwaggerComponentsExplorer.getParameter(props.swagger.components)(p)
              ?.in === "path",
        ).length
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
        parameters: (route.parameters ?? [])
          .map((p) =>
            SwaggerComponentsExplorer.getParameter(props.swagger.components)(p),
          )
          .filter((p) => p !== null && p.in === "path")
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
              ([key, value]) =>
                key !== "200" &&
                key !== "201" &&
                key !== "default" &&
                !!SwaggerComponentsExplorer.getResponse(
                  props.swagger.components,
                )(value)?.content?.["application/json"],
            )
            .map(([key, value]) => {
              const r = SwaggerComponentsExplorer.getResponse(
                props.swagger.components,
              )(value)!;
              return [
                key,
                {
                  description: r.description,
                  schema: r.content?.["application/json"]?.schema ?? {},
                },
              ];
            }),
        ),
        deprecated: route.deprecated ?? false,
        comment: () => describe(props.swagger)(route),
        tags: route.tags ?? [],
      };
    };

  const describe =
    (swagger: ISwagger) =>
    (route: ISwaggerRoute): string => {
      const commentTags: string[] = [];
      const add = (text: string) => {
        if (commentTags.every((line) => line !== text)) commentTags.push(text);
      };

      let description: string = route.description ?? "";
      if (route.summary) {
        const emended: string = route.summary.endsWith(".")
          ? route.summary
          : route.summary + ".";
        if (
          !!description.length &&
          !description.startsWith(route.summary) &&
          !route["x-nestia-jsDocTags"]?.some((t) => t.name === "summary")
        )
          description = `${emended}\n${description}`;
      }
      for (const p of route.parameters ?? []) {
        const param: ISwaggerRouteParameter | null = (() => {
          if (!typia.is<ISwaggerRouteParameter.IReference>(p))
            return typia.is<ISwaggerRouteParameter>(p) ? p : null;
          return (
            swagger.components.parameters?.[
              p.$ref.replace(`#/components/parameters/`, ``)
            ] ?? null
          );
        })();
        if (param !== null && param.description)
          add(`@param ${param.name} ${param.description}`);
      }
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

  const isNotObjectLiteral = (schema: ISwaggerSchema): boolean =>
    SwaggerTypeChecker.isReference(schema) ||
    SwaggerTypeChecker.isBoolean(schema) ||
    SwaggerTypeChecker.isNumber(schema) ||
    SwaggerTypeChecker.isString(schema) ||
    SwaggerTypeChecker.isUnknown(schema) ||
    (SwaggerTypeChecker.isAnyOf(schema) &&
      schema.anyOf.every(isNotObjectLiteral)) ||
    (SwaggerTypeChecker.isOneOf(schema) &&
      schema.oneOf.every(isNotObjectLiteral)) ||
    (SwaggerTypeChecker.isArray(schema) && isNotObjectLiteral(schema.items));

  const emplaceBodySchema =
    (from: "request" | "response") =>
    (emplacer: (schema: ISwaggerSchema) => ISwaggerSchema.IReference) =>
    (meta?: {
      description?: string;
      content?: ISwaggerRouteBodyContent;
      "x-nestia-encrypted"?: boolean;
    }): false | null | IMigrateRoute.IBody => {
      if (!meta?.content) return null;

      const entries: [string, { schema: ISwaggerSchema }][] = Object.entries(
        meta.content,
      );
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
          schema: isNotObjectLiteral(schema) ? schema : emplacer(schema),
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
          schema: isNotObjectLiteral(schema) ? schema : emplacer(schema),
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
            schema: isNotObjectLiteral(schema) ? schema : emplacer(schema),
          };
        }
      }
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
}

const SUPPORTED_METHODS: Set<string> = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
]);
