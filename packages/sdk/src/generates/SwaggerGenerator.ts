import { SwaggerCustomizer } from "@nestia/core";
import {
  OpenApi,
  OpenApiV3,
  OpenApiV3_1,
  OpenApiV3_2,
  SwaggerV2,
} from "@typia/interface";
import { OpenApiConverter } from "@typia/utils";
import fs from "fs";
import path from "path";
import { Singleton } from "tstl";
import type { IJsonSchemaCollection } from "typia";

import { INestiaConfig } from "../INestiaConfig";
import {
  JsonSchemasProgrammer,
  MetadataSchema,
  sizeOf,
} from "../internal/legacy";
import { ITypedApplication } from "../structures/ITypedApplication";
import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { FileRetriever } from "../utils/FileRetriever";
import { SdkHttpParameterProgrammer } from "./internal/SdkHttpParameterProgrammer";
import { SwaggerOperationComposer } from "./internal/SwaggerOperationComposer";
import { SwaggerReadonlyArrayEmender } from "./internal/SwaggerReadonlyArrayEmender";

export namespace SwaggerGenerator {
  export const generate = async (app: ITypedApplication): Promise<void> => {
    // GET CONFIGURATION
    console.log("Generating Swagger Document");
    if (app.project.config.swagger === undefined)
      throw new Error("Swagger configuration is not defined.");
    const config: INestiaConfig.ISwaggerConfig = app.project.config.swagger;

    // TARGET LOCATION
    const parsed: path.ParsedPath = path.parse(config.output);
    const location: string = !!parsed.ext
      ? path.resolve(config.output)
      : path.join(path.resolve(config.output), "swagger.json");
    const directory: string = path.dirname(location);
    if (fs.existsSync(directory) === false)
      try {
        await fs.promises.mkdir(directory, { recursive: true });
      } catch {}
    if (fs.existsSync(directory) === false)
      throw new Error(
        `Error on NestiaApplication.swagger(): failed to create output directory: ${directory}`,
      );
    // COMPOSE SWAGGER DOCUMENT
    const document: OpenApi.IDocument = compose({
      config,
      routes: app.routes.filter((route) => route.protocol === "http"),
      document: await initialize(config),
    });
    const specified:
      | OpenApi.IDocument
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApiV3_2.IDocument =
      (config.openapi ?? "3.2") === "3.2"
        ? document
        : OpenApiConverter.downgradeDocument(document, config.openapi as "2.0");
    await fs.promises.writeFile(
      location,
      !config.beautify
        ? JSON.stringify(specified)
        : JSON.stringify(
            specified,
            null,
            typeof config.beautify === "number" ? config.beautify : 2,
          ),
      "utf8",
    );
  };

  export const compose = (props: {
    config: Omit<INestiaConfig.ISwaggerConfig, "output">;
    routes: ITypedHttpRoute[];
    document: OpenApi.IDocument;
  }): OpenApi.IDocument => {
    // GATHER METADATA
    const routes: ITypedHttpRoute[] = props.routes.filter(
      (r) =>
        r.jsDocTags.every(
          (tag) => tag.name !== "internal" && tag.name !== "hidden",
        ) && isSwaggerExcluded(r) === false,
    );
    const metadatas: MetadataSchema[] = routes
      .map((r) => [
        r.success.metadata,
        ...SdkHttpParameterProgrammer.getAll(r).map((p) => p.metadata),
        ...Object.values(r.exceptions).map((e) => e.metadata),
      ])
      .flat()
      .filter((m) => sizeOf(m) !== 0);

    // COMPOSE JSON SCHEMAS
    const json: IJsonSchemaCollection = JsonSchemasProgrammer.writeSchemas({
      version: "3.1",
      metadatas,
    });
    json.schemas.forEach((schema, i) =>
      SwaggerReadonlyArrayEmender.emend({
        components: json.components,
        schema,
        metadata: metadatas[i]!,
      }),
    );
    const dict: WeakMap<MetadataSchema, OpenApi.IJsonSchema> = new WeakMap();
    json.schemas.forEach((schema, i) => dict.set(metadatas[i]!, schema));
    const schema = (
      metadata: MetadataSchema,
    ): OpenApi.IJsonSchema | undefined => dict.get(metadata);

    // COMPOSE DOCUMENT
    const document: OpenApi.IDocument = props.document;
    document.components.schemas ??= {};
    Object.assign(document.components.schemas, json.components.schemas);
    fillPaths({
      ...props,
      routes,
      schema,
      document,
    });
    return document;
  };

  export const initialize = async (
    config: Omit<INestiaConfig.ISwaggerConfig, "output">,
  ): Promise<OpenApi.IDocument> => {
    const pack = new Singleton(
      async (): Promise<Partial<OpenApi.IDocument.IInfo> | null> => {
        const location: string | null = await FileRetriever.file(
          "package.json",
        )(process.cwd());
        if (location === null) return null;

        try {
          const content: string = await fs.promises.readFile(location, "utf8");
          const data = JSON.parse(content) as {
            name?: string;
            version?: string;
            description?: string;
            license?:
              | string
              | {
                  type: string;
                  /** @format uri */
                  url: string;
                };
          };
          return {
            title: typeof data.name === "string" ? data.name : undefined,
            version:
              typeof data.version === "string" ? data.version : undefined,
            description:
              typeof data.description === "string"
                ? data.description
                : undefined,
            license: isLicense(data.license)
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
      openapi: "3.2.0",
      servers: config.servers ?? [
        {
          url: "https://github.com/samchon/nestia",
          // The description is the hint that this url is a placeholder, and it
          // is worth keeping wherever it fits. Swagger 2.0 has nowhere to put a
          // server description, and the downgrader refuses to discard one
          // silently — correctly, because a description in a user-supplied
          // `servers` entry is their document content. This one is nestia's
          // own, so it must not be the thing that makes a supported output
          // version impossible to generate.
          ...(config.openapi === "2.0"
            ? {}
            : { description: "insert your server url" }),
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
        securitySchemes: config.security,
      },
      // a copy, because composing pushes each route's tags into this list
      tags: clone(config.tags ?? []),
      "x-typia-emended-v12": true,
    };
  };

  const isLicense = (
    input: unknown,
  ): input is
    | string
    | {
        type: string;
        url: string;
      } =>
    typeof input === "string" ||
    (typeof input === "object" &&
      input !== null &&
      Array.isArray(input) === false &&
      typeof (input as { type?: unknown }).type === "string" &&
      typeof (input as { url?: unknown }).url === "string");

  const fillPaths = (props: {
    config: Omit<INestiaConfig.ISwaggerConfig, "output">;
    document: OpenApi.IDocument;
    schema: (metadata: MetadataSchema) => OpenApi.IJsonSchema | undefined;
    routes: ITypedHttpRoute[];
  }): void => {
    // SWAGGER CUSTOMIZER
    const customizers: Array<{
      route: ITypedHttpRoute;
      method: OpenApi.Method;
      path: string;
      closures: Function[];
    }> = [];
    const neighbor = {
      at: new Singleton(() => {
        const functor: Map<Function, Endpoint> = new Map();
        for (const r of props.routes) {
          const method: OpenApi.Method =
            r.method.toLowerCase() as OpenApi.Method;
          const path: string = getPath(r);
          const operation: OpenApi.IOperation | undefined =
            props.document.paths?.[path]?.[method];
          if (operation === undefined) continue;
          functor.set(r.function, {
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
            return props.document.paths?.[path]?.[method];
          },
      ),
    };

    // COMPOSE OPERATIONS
    const violations: string[] = [];
    for (const r of props.routes) {
      const method: OpenApi.Method = r.method.toLowerCase() as OpenApi.Method;
      const path: string = getPath(r);
      props.document.paths ??= {};
      props.document.paths[path] ??= {};
      props.document.paths[path][method] = SwaggerOperationComposer.compose({
        ...props,
        route: r,
      });
      violations.push(
        ...validateSecurity({
          config: props.config,
          route: r,
          security: props.document.paths[path][method]!.security,
        }),
      );

      const closure: Function | Function[] | undefined = Reflect.getMetadata(
        "nestia/SwaggerCustomizer",
        r.controller.class.prototype,
        r.name,
      );
      if (closure !== undefined)
        customizers.push({
          route: r,
          method,
          path,
          closures: Array.isArray(closure) ? closure : [closure],
        });
    }

    if (violations.length !== 0)
      throw new Error(
        [
          `Error on NestiaApplication.swagger(): invalid security requirements. Declare every scheme a route names, with its scopes, in the "swagger.security" property of "nestia.config.ts".`,
          "",
          "List of violations:",
          ...violations,
        ].join("\n"),
      );

    // DETACH, then DO CUSTOMIZE
    detach(props.document);
    // Each customizer receives the operation composed for its own route, found
    // before any customizer runs, since one may move or delete paths.
    const operations: OpenApi.IOperation[] = customizers.map(
      (c) => props.document.paths![c.path]![c.method]!,
    );
    customizers.forEach((c, i) => {
      for (const closure of c.closures)
        closure({
          swagger: props.document,
          method: c.route.method,
          path: c.path,
          route: operations[i]!,
          at: (func: Function) => neighbor.at.get().get(func),
          get: (accessor: Accessor) => neighbor.get.get()(accessor),
        } satisfies SwaggerCustomizer.IProps);
    });
  };

  /**
   * Replaces every member of the composed document with a copy, in place.
   *
   * Operations still hold values nestia does not own by reference: decorator
   * examples, `@ApiExtension` values, security requirements, and the configured
   * servers, security schemes, and document info. They outlive the document,
   * since route metadata and the configuration serve every composition in the
   * process, so a `SwaggerCustomizer` or a caller editing one document edited
   * all of them, and the next composition started from the edit. It runs before
   * the customizers, which may then edit freely.
   */
  const detach = (document: OpenApi.IDocument): void => {
    const copy: OpenApi.IDocument = clone(document);
    for (const key of Object.keys(document))
      delete (document as unknown as Record<string, unknown>)[key];
    Object.assign(document, copy);
  };

  /**
   * Copies the arrays and plain objects `value` is built of, keeping every
   * other value as it is.
   *
   * A document is edited as the tree its JSON is, so every reference to an
   * array or plain object gets its own copy, except a reference back to an
   * enclosing one, which stays circular. Values are not converted: a JSON copy
   * would throw on a bigint example or turn a `Date` into a string before the
   * customizer or caller that handles it runs.
   */
  const clone = <T>(
    value: T,
    ancestors: Map<object, object> = new Map(),
  ): T => {
    if (typeof value !== "object" || value === null) return value;
    const prototype: unknown = Object.getPrototypeOf(value);
    const array: boolean = Array.isArray(value);
    if (!array && prototype !== Object.prototype && prototype !== null)
      return value;
    const circular: object | undefined = ancestors.get(value);
    if (circular !== undefined) return circular as T;
    const output: Record<string, unknown> = (
      array ? new Array((value as unknown[]).length) : {}
    ) as Record<string, unknown>;
    ancestors.set(value, output);
    for (const key of Object.keys(value))
      Object.defineProperty(output, key, {
        value: clone((value as Record<string, unknown>)[key], ancestors),
        writable: true,
        enumerable: true,
        configurable: true,
      });
    ancestors.delete(value);
    return output as T;
  };

  /**
   * The violations of an operation's security requirements against the
   * configured `swagger.security` schemes: a scheme it never declares, scopes
   * on a scheme other than OAuth2 or OpenID Connect, and an OAuth2 scope no
   * flow of the scheme declares. An OpenID Connect scheme lists no scopes of
   * its own, so its scopes are not checked.
   */
  const validateSecurity = (props: {
    config: Omit<INestiaConfig.ISwaggerConfig, "output">;
    route: ITypedHttpRoute;
    security: Record<string, string[]>[] | undefined;
  }): string[] => {
    const violations: string[] = [];
    const report = (message: string): void => {
      violations.push(
        `  - ${message} (${props.route.controller.class.name}.${props.route.name}() at "${props.route.method} ${props.route.path}")`,
      );
    };
    for (const requirement of props.security ?? [])
      for (const [name, scopes] of Object.entries(requirement)) {
        const scheme: OpenApi.ISecurityScheme | undefined =
          props.config.security?.[name];
        if (scheme === undefined)
          report(`target security scheme "${name}" does not exist.`);
        else if (scopes.length === 0 || scheme.type === "openIdConnect")
          continue;
        else if (scheme.type !== "oauth2")
          report(
            `target security scheme "${name}" is neither "oauth2" nor "openIdConnect" type, but you've configured the scopes.`,
          );
        else {
          const declared: Set<string> = new Set(
            Object.values(scheme.flows ?? {}).flatMap((flow) =>
              Object.keys(
                (flow as { scopes?: Record<string, string> } | undefined)
                  ?.scopes ?? {},
              ),
            ),
          );
          for (const scope of scopes)
            if (declared.has(scope) === false)
              report(
                `target security scheme "${name}" does not have a specific scope "${scope}".`,
              );
        }
      }
    return violations;
  };

  const getPath = (route: ITypedHttpRoute): string => {
    let str: string = route.path;
    for (const param of route.pathParameters)
      str = str.replace(`:${param.field}`, `{${param.field}}`);
    return str;
  };

  const isSwaggerExcluded = (route: ITypedHttpRoute): boolean => {
    const controller: unknown = Reflect.getMetadata(
      "swagger/apiExcludeController",
      route.controller.class,
    );
    if (Array.isArray(controller) && controller[0] === true) return true;

    const endpoint: unknown = Reflect.getMetadata(
      "swagger/apiExcludeEndpoint",
      route.function,
    );
    return (
      endpoint !== undefined &&
      (typeof endpoint !== "object" ||
        endpoint === null ||
        (endpoint as { disable?: boolean }).disable !== false)
    );
  };
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
