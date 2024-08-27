import { SwaggerCustomizer } from "@nestia/core";
import { OpenApi, OpenApiV3, SwaggerV2 } from "@samchon/openapi";
import fs from "fs";
import path from "path";
import { Singleton } from "tstl";
import typia, { IJsonApplication } from "typia";
import { JsonApplicationProgrammer } from "typia/lib/programmers/json/JsonApplicationProgrammer";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";

import { INestiaConfig } from "../INestiaConfig";
import { ITypedApplication } from "../structures/ITypedApplication";
import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { ITypedHttpRouteParameter } from "../structures/ITypedHttpRouteParameter";
import { FileRetriever } from "../utils/FileRetriever";
import { SwaggerOperationComposer } from "./internal/SwaggerOperationComposer";

export namespace SwaggerGenerator {
  export const generate = async (app: ITypedApplication): Promise<void> => {
    // GET CONFIGURATION
    console.log("Generating Swagger Document");
    if (app.project.config.swagger === undefined)
      throw new Error("Swagger configuration is not defined.");
    const config: INestiaConfig.ISwaggerConfig = app.project.config.swagger;

    // TARGET LOCATION
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

    // COMPOSE SWAGGER DOCUMENT
    const document: OpenApi.IDocument = compose({
      config,
      routes: app.routes.filter((route) => route.protocol === "http"),
      document: await initialize(config),
    });
    const specified:
      | OpenApi.IDocument
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument =
      config.openapi === "2.0"
        ? OpenApi.downgrade(document, config.openapi as "2.0")
        : config.openapi === "3.0"
          ? OpenApi.downgrade(document, config.openapi as "3.0")
          : document;
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
    const metadatas: Metadata[] = props.routes
      .filter((r) => r.protocol === "http")
      .map((r) => [
        r.success.metadata,
        ...r.parameters.map((p) => p.metadata),
        ...Object.values(r.exceptions).map((e) => e.metadata),
      ])
      .flat()
      .filter((m) => m.size() !== 0);

    // COMPOSE JSON SCHEMAS
    const json: IJsonApplication = JsonApplicationProgrammer.write("3.1")(
      metadatas,
    ) as IJsonApplication;
    const dict: WeakMap<Metadata, OpenApi.IJsonSchema> = new WeakMap();
    json.schemas.forEach((schema, i) => dict.set(metadatas[i], schema));
    const schema = (metadata: Metadata): OpenApi.IJsonSchema | undefined =>
      dict.get(metadata);

    // COMPOSE DOCUMENT
    const document: OpenApi.IDocument = props.document;
    document.components.schemas ??= {};
    Object.assign(document.components.schemas, json.components.schemas);
    fillPaths({ ...props, schema, document });

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
        securitySchemes: config.security,
      },
      tags: config.tags ?? [],
      "x-samchon-emended": true,
    };
  };

  const fillPaths = (props: {
    config: Omit<INestiaConfig.ISwaggerConfig, "output">;
    document: OpenApi.IDocument;
    schema: (metadata: Metadata) => OpenApi.IJsonSchema | undefined;
    routes: ITypedHttpRoute[];
  }): void => {
    // SWAGGER CUSTOMIZER
    const customizers: Array<() => void> = [];
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
    for (const r of props.routes) {
      const operation: OpenApi.IOperation = SwaggerOperationComposer.compose({
        ...props,
        route: r,
      });
      const path: string = getPath(r);
      props.document.paths ??= {};
      props.document.paths[path] ??= {};
      props.document.paths[path][r.method.toLowerCase() as "get"] = operation;

      const closure: Function | Function[] | undefined = Reflect.getMetadata(
        "nestia/SwaggerCustomizer",
        r.controller.class.prototype,
        r.name,
      );
      if (closure !== undefined) {
        const array: Function[] = Array.isArray(closure) ? closure : [closure];
        customizers.push(() => {
          for (const closure of array)
            closure({
              swagger: props.document,
              method: r.method,
              path,
              route: operation,
              at: (func: Function) => neighbor.at.get().get(func),
              get: (accessor: Accessor) => neighbor.get.get()(accessor),
            } satisfies SwaggerCustomizer.IProps);
        });
      }
    }

    // DO CUSTOMIZE
    for (const fn of customizers) fn();
  };

  const getPath = (route: {
    path: string;
    parameters: ITypedHttpRouteParameter[];
  }): string => {
    let str: string = route.path;
    const filtered: ITypedHttpRouteParameter.IParam[] = route.parameters.filter(
      (param) => param.category === "param",
    );
    for (const param of filtered)
      str = str.replace(`:${param.field}`, `{${param.field}}`);
    return str;
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
