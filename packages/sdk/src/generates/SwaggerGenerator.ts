import { OpenApi } from "@samchon/openapi";
import fs from "fs";
import path from "path";
import { Singleton } from "tstl";
import ts from "typescript";
import typia, { IJsonApplication } from "typia";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { JsonApplicationProgrammer } from "typia/lib/programmers/json/JsonApplicationProgrammer";

import { INestiaConfig } from "../INestiaConfig";
import { INestiaProject } from "../structures/INestiaProject";
import { ISwaggerError } from "../structures/ISwaggerError";
import { ISwaggerLazyProperty } from "../structures/ISwaggerLazyProperty";
import { ISwaggerLazySchema } from "../structures/ISwaggerLazySchema";
import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { ITypedWebSocketRoute } from "../structures/ITypedWebSocketRoute";
import { FileRetriever } from "../utils/FileRetriever";
import { MapUtil } from "../utils/MapUtil";
import { SwaggerSchemaGenerator } from "./internal/SwaggerSchemaGenerator";

export namespace SwaggerGenerator {
  export interface IProps {
    config: INestiaConfig.ISwaggerConfig;
    checker: ts.TypeChecker;
    collection: MetadataCollection;
    lazySchemas: Array<ISwaggerLazySchema>;
    lazyProperties: Array<ISwaggerLazyProperty>;
    errors: ISwaggerError[];
    swagger: OpenApi.IDocument;
  }

  export const generate =
    (project: INestiaProject) =>
    async (
      routeList: Array<ITypedHttpRoute | ITypedWebSocketRoute>,
    ): Promise<void> => {
      console.log("Generating Swagger Documents");

      // VALIDATE SECURITY
      const config = project.config.swagger!;
      const httpRoutes: ITypedHttpRoute[] = routeList.filter(
        (route): route is ITypedHttpRoute => route.protocol === "http",
      ) as ITypedHttpRoute[];
      validate_security(config)(httpRoutes);

      // PREPARE ASSETS
      const parsed: path.ParsedPath = path.parse(config.output);
      const directory: string = path.dirname(parsed.dir);
      if (fs.existsSync(directory) === false)
        try {
          await fs.promises.mkdir(directory);
        } catch {}
      if (fs.existsSync(directory) === false)
        throw new Error(
          `Error on NestiaApplication.swagger(): failed to create output directory: ${directory}`,
        );

      const location: string = !!parsed.ext
        ? path.resolve(config.output)
        : path.join(path.resolve(config.output), "swagger.json");

      const collection: MetadataCollection = new MetadataCollection({
        replace: MetadataCollection.replace,
      });

      // CONSTRUCT SWAGGER DOCUMENTS
      const errors: ISwaggerError[] = [];
      const lazySchemas: Array<ISwaggerLazySchema> = [];
      const lazyProperties: Array<ISwaggerLazyProperty> = [];
      const swagger: OpenApi.IDocument = await initialize(config);
      const pathDict: Map<
        string,
        Record<string, OpenApi.IOperation>
      > = new Map();

      for (const route of httpRoutes) {
        if (route.jsDocTags.find((tag) => tag.name === "internal")) continue;

        const path: Record<string, OpenApi.IOperation> = MapUtil.take(
          pathDict,
          get_path(route.path, route.parameters),
          () => ({}),
        );
        path[route.method.toLowerCase()] = generate_route({
          config,
          checker: project.checker,
          collection,
          lazySchemas,
          lazyProperties,
          errors,
          swagger,
        })(route);
      }
      swagger.paths = {};
      for (const [path, routes] of pathDict) swagger.paths[path] = routes;

      // FILL JSON-SCHEMAS
      const application: IJsonApplication<"3.1"> =
        JsonApplicationProgrammer.write("3.1")(
          lazySchemas.map(({ metadata }) => metadata),
        ) as IJsonApplication<"3.1">;
      swagger.components = {
        ...(swagger.components ?? {}),
        ...(application.components ?? {}),
      };
      lazySchemas.forEach(({ schema }, index) => {
        Object.assign(schema, application.schemas[index]!);
      });
      for (const p of lazyProperties)
        Object.assign(
          p.schema,
          (
            application.components.schemas?.[
              p.object
            ] as OpenApi.IJsonSchema.IObject
          )?.properties?.[p.property] ?? {},
        );

      // CONFIGURE SECURITY
      if (config.security) fill_security(config.security, swagger);

      // REPORT ERRORS
      if (errors.length) {
        for (const e of errors)
          console.error(
            `${path.relative(process.cwd(), e.route.location)}:${
              e.route.controller.name
            }.${e.route.name}:${
              e.from
            } - error TS(@nestia/sdk): invalid type detected.\n\n` +
              e.messages.map((m) => `  - ${m}`).join("\n"),
            "\n\n",
          );
        throw new TypeError("Invalid type detected");
      }

      // SWAGGER CUSTOMIZER
      const customizer = {
        at: new Singleton(() => {
          const functor: Map<Function, Endpoint> = new Map();
          for (const route of httpRoutes) {
            const method: OpenApi.Method =
              route.method.toLowerCase() as OpenApi.Method;
            const path: string = get_path(route.path, route.parameters);
            const operation: OpenApi.IOperation | undefined =
              swagger.paths?.[path]?.[method];
            if (operation === undefined) continue;
            functor.set(route.function, {
              method,
              path,
              route: operation,
            });
          }
          return functor;
        }),
        get: new Singleton(
          () =>
            (key: Accessor): OpenApi.IOperation | undefined => {
              const method: OpenApi.Method =
                key.method.toLowerCase() as OpenApi.Method;
              const path: string =
                "/" +
                key.path
                  .split("/")
                  .filter((str) => !!str.length)
                  .map((str) =>
                    str.startsWith(":") ? `{${str.substring(1)}}` : str,
                  )
                  .join("/");
              return swagger.paths?.[path]?.[method];
            },
        ),
      };
      for (const route of httpRoutes) {
        if (
          false ===
          Reflect.hasMetadata(
            "nestia/SwaggerCustomizer",
            route.controller.prototype,
            route.name,
          )
        )
          continue;

        const path: string = get_path(route.path, route.parameters);
        const method: OpenApi.Method =
          route.method.toLowerCase() as OpenApi.Method;
        const target: OpenApi.IOperation | undefined =
          swagger.paths?.[path]?.[method];
        if (target === undefined) continue;

        const closure: Function | Function[] = Reflect.getMetadata(
          "nestia/SwaggerCustomizer",
          route.controller.prototype,
          route.name,
        );
        const array: Function[] = Array.isArray(closure) ? closure : [closure];
        for (const fn of array)
          fn({
            route: target,
            method,
            path,
            swagger,
            at: (func: Function) => customizer.at.get().get(func),
            get: (accessor: Accessor) => customizer.get.get()(accessor),
          });
      }

      // DO GENERATE
      await fs.promises.writeFile(
        location,
        !config.beautify
          ? JSON.stringify(swagger)
          : JSON.stringify(
              swagger,
              null,
              typeof config.beautify === "number" ? config.beautify : 2,
            ),
        "utf8",
      );
    };

  const validate_security =
    (config: INestiaConfig.ISwaggerConfig) =>
    (routeList: ITypedHttpRoute[]): void | never => {
      const securityMap: Map<
        string,
        { scheme: OpenApi.ISecurityScheme; scopes: Set<string> }
      > = new Map();
      for (const [key, value] of Object.entries(config.security ?? {}))
        securityMap.set(key, {
          scheme: emend_security(value),
          scopes:
            value.type === "oauth2"
              ? new Set([
                  ...Object.keys(value.flows.authorizationCode?.scopes ?? {}),
                  ...Object.keys(value.flows.implicit?.scopes ?? {}),
                  ...Object.keys(value.flows.password?.scopes ?? {}),
                  ...Object.keys(value.flows.clientCredentials?.scopes ?? {}),
                ])
              : new Set(),
        });

      const validate =
        (reporter: (str: string) => void) =>
        (key: string, scopes: string[]) => {
          const security = securityMap.get(key);
          if (security === undefined)
            return reporter(`target security scheme "${key}" does not exists.`);
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
                `  - ${str} (${route.controller.name}.${route.name}() at "${route.location}")`,
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
  export const initialize = async (
    config: INestiaConfig.ISwaggerConfig,
  ): Promise<OpenApi.IDocument> => {
    const pack = new Singleton(
      async (): Promise<Partial<OpenApi.IDocument.IInfo> | null> => {
        const location: string | null = await FileRetriever.file(
          "package.json",
        )(process.cwd());
        if (location === null) return null;

        try {
          const content: string = await fs.promises.readFile(location, "utf8");
          const data = typia.json.assertParse<{
            name?: string;
            version?: string;
            description?: string;
            license?:
              | string
              | {
                  type: string;
                  /**
                   * @format uri
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
      openapi: "3.1.0",
      servers: config.servers ?? [
        {
          url: "https://github.com/samchon/nestia",
          description: "insert your server url",
        },
      ],
      info: {
        ...(config.info ?? {}),
        version: config.info?.version ?? (await pack.get())?.version ?? "0.1.0",
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
      components: {
        schemas: {},
      },
      tags: config.tags ?? [],
      "x-samchon-emended": true,
    };
  };

  function get_path(
    path: string,
    parameters: ITypedHttpRoute.IParameter[],
  ): string {
    const filtered: ITypedHttpRoute.IParameter[] = parameters.filter(
      (param) => param.category === "param" && !!param.field,
    );
    for (const param of filtered)
      path = path.replace(`:${param.field}`, `{${param.field}}`);
    return path;
  }

  export const generate_route =
    (props: IProps) =>
    (route: ITypedHttpRoute): OpenApi.IOperation => {
      // FIND REQUEST BODY
      const body = route.parameters.find((param) => param.category === "body");

      // CONSTRUCT SUMMARY & DESCRIPTION
      const getJsDocTexts = (name: string): string[] =>
        route.jsDocTags
          .filter(
            (tag) =>
              tag.name === name &&
              tag.text &&
              tag.text.find(
                (elem) => elem.kind === "text" && elem.text.length,
              ) !== undefined,
          )
          .map((tag) => tag.text!.find((elem) => elem.kind === "text")!.text);
      const description: string | undefined = route.description?.length
        ? route.description
        : undefined;
      const summary: string | undefined = (() => {
        if (description === undefined) return undefined;

        const [explicit] = getJsDocTexts("summary");
        if (explicit?.length) return explicit;

        const index: number = description.indexOf("\n");
        const top: string = (
          index === -1 ? description : description.substring(0, index)
        ).trim();
        return top.endsWith(".") ? top.substring(0, top.length - 1) : undefined;
      })();
      const deprecated = route.jsDocTags.find(
        (tag) => tag.name === "deprecated",
      );

      // CONSTRUCT TAGS
      const tagSet: Set<string> = new Set([
        ...route.swaggerTags,
        ...getJsDocTexts("tag").map((tag) => tag.split(" ")[0]),
      ]);
      props.swagger.tags ??= [];
      for (const tag of tagSet)
        if (props.swagger.tags!.find((elem) => elem.name === tag) === undefined)
          props.swagger.tags!.push({ name: tag });
      for (const texts of getJsDocTexts("tag")) {
        const [name, ...description] = texts.split(" ");
        if (description.length)
          props.swagger.tags!.find(
            (elem) => elem.name === name,
          )!.description ??= description.join(" ");
      }

      // FINALIZE
      return {
        deprecated: deprecated ? true : undefined,
        tags: [...tagSet],
        operationId:
          route.operationId ??
          props.config.operationId?.({
            class: route.controller.name,
            function: route.name,
            method: route.method as "GET",
            path: route.path,
          }),
        parameters: route.parameters
          .filter((param) => param.category !== "body")
          .map((param) => SwaggerSchemaGenerator.parameter(props)(route)(param))
          .flat(),
        requestBody: body
          ? SwaggerSchemaGenerator.body(props)(route)(body)
          : undefined,
        responses: SwaggerSchemaGenerator.response(props)(route),
        summary,
        description,
        security: route.security.length ? route.security : undefined,
        ...(props.config.additional === true
          ? {
              "x-nestia-namespace": [
                ...route.path
                  .split("/")
                  .filter((str) => str.length && str[0] !== ":"),
                route.name,
              ].join("."),
              "x-nestia-jsDocTags": route.jsDocTags,
              "x-nestia-method": route.method,
            }
          : {}),
      };
    };

  function fill_security(
    security: Required<INestiaConfig.ISwaggerConfig>["security"],
    swagger: OpenApi.IDocument,
  ): void {
    swagger.components.securitySchemes = {};
    for (const [key, value] of Object.entries(security))
      swagger.components.securitySchemes[key] = emend_security(value);
  }

  function emend_security(
    input: OpenApi.ISecurityScheme,
  ): OpenApi.ISecurityScheme {
    if (input.type === "apiKey")
      return {
        ...input,
        in: input.in ?? "header",
        name: input.name ?? "Authorization",
      };
    return input;
  }
}

interface Accessor {
  method: string;
  path: string;
}
interface Endpoint {
  method: string;
  path: string;
  route: OpenApi.IOperation;
}
