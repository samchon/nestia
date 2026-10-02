import { INestApplication } from "@nestjs/common";
import { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@typia/interface";
import { OpenApiConverter } from "@typia/utils";
import path from "path";
import { TreeMap } from "tstl";
import { OpenApi } from "typia";

import { INestiaConfig } from "./INestiaConfig";
import { AccessorAnalyzer } from "./analyses/AccessorAnalyzer";
import { ConfigAnalyzer } from "./analyses/ConfigAnalyzer";
import { PathAnalyzer } from "./analyses/PathAnalyzer";
import { ReflectControllerAnalyzer } from "./analyses/ReflectControllerAnalyzer";
import { TypedHttpRouteAnalyzer } from "./analyses/TypedHttpRouteAnalyzer";
import { SwaggerGenerator } from "./generates/SwaggerGenerator";
import { INestiaProject } from "./structures/INestiaProject";
import { INestiaSdkInput } from "./structures/INestiaSdkInput";
import { IOperationMetadata } from "./structures/IOperationMetadata";
import { IReflectController } from "./structures/IReflectController";
import { IReflectOperationError } from "./structures/IReflectOperationError";
import { ITypedHttpRoute } from "./structures/ITypedHttpRoute";
import { VersioningStrategy } from "./utils/VersioningStrategy";

/**
 * Composes the Swagger document of a running NestJS application, without files.
 *
 * @evidence contracts/common.md#principled-implementation The controllers are taken from the application's module graph and analyzed like the CLI does, and only the HTTP routes are composed.
 * @evidence contracts/common.md#clear-and-simple-design One public function with a private analysis pipeline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It uses the same analyzers and composer as the CLI, so both produce one document.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidence contracts/portability.md#os-neutral-implementation Controller source lookup is delegated to ConfigAnalyzer.application; diagnostic filenames use Node path.relative from process.cwd. Route paths and versions remain protocol text rather than native filesystem identity.
 */
export namespace NestiaSwaggerComposer {
  /**
   * Returns the OpenAPI document of the application in the requested version.
   *
   * The document is composed as OpenAPI 3.2 and converted to the configured
   * older version; every analysis error is collected and thrown together.
   *
   * @evidence contracts/common.md#principled-implementation Composition runs at the newest version and `OpenApiConverter.downgradeDocument` produces the older ones, so version differences live in one converter, and a failure of the analysis throws one error that lists every problem.
   * @evidence contracts/common.md#clear-and-simple-design One function over the shared analyzers and the Swagger generator.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No route is special-cased; the module graph is read through `ConfigAnalyzer.application`.
   * @evidence contracts/common.md#meaningful-documentation The comment states the returned versions and the error behavior.
   * @evidence contracts/portability.md#os-neutral-implementation The composer receives an existing application and writes no output file. Its delegated controller discovery obtains native source locations, and its report renders those locations through path.relative; initialize may read package metadata for default info.
   */
  export const document = async (
    app: INestApplication,
    config: Omit<INestiaConfig.ISwaggerConfig, "output">,
  ): Promise<
    | OpenApi.IDocument
    | OpenApiV3_1.IDocument
    | OpenApiV3.IDocument
    | SwaggerV2.IDocument
  > => {
    const input: INestiaSdkInput = await ConfigAnalyzer.application(app);
    const document: OpenApi.IDocument = await SwaggerGenerator.compose({
      config,
      routes: analyze(input),
      document: await SwaggerGenerator.initialize(config),
    });
    return (config.openapi ?? "3.2") === "3.2"
      ? document
      : OpenApiConverter.downgradeDocument(document, config.openapi as "2.0");
  };

  const analyze = (input: INestiaSdkInput): ITypedHttpRoute[] => {
    // GET REFLECT CONTROLLERS
    const unique: WeakSet<any> = new WeakSet();
    const project: Omit<INestiaProject, "config"> = {
      input,
      errors: [],
      warnings: [],
    };
    const controllers: IReflectController[] = project.input.controllers
      .map((c) =>
        ReflectControllerAnalyzer.analyze({ project, controller: c, unique }),
      )
      .filter((c): c is IReflectController => c !== null);
    if (project.errors.length)
      throw report({ type: "error", errors: project.errors });

    // CONVERT TO TYPED OPERATIONS
    const routes: ITypedHttpRoute[] = [];
    for (const c of controllers)
      for (const o of c.operations) {
        if (o.protocol !== "http") continue;
        const pathList: Set<string> = new Set();
        const versions: string[] = VersioningStrategy.merge(project)({
          controller: c.versions,
          method: o.versions,
        });
        for (const v of versions)
          for (const prefix of wrapPaths(c.prefixes))
            for (const cPath of wrapPaths(c.paths))
              for (const filePath of wrapPaths(o.paths)) {
                const localPath: string = PathAnalyzer.join(
                  prefix,
                  cPath,
                  filePath,
                );
                pathList.add(
                  PathAnalyzer.joinWithGlobalPrefix({
                    globalPrefix: project.input.globalPrefix?.prefix ?? "",
                    exclude: project.input.globalPrefix?.exclude,
                    excludePath: localPath,
                    method: o.method,
                    path: PathAnalyzer.join(v, localPath),
                  }),
                );
              }
        routes.push(
          ...TypedHttpRouteAnalyzer.analyze({
            controller: c,
            errors: project.errors,
            operation: o,
            paths: Array.from(pathList),
          }),
        );
      }
    if (project.errors.length)
      throw report({ type: "error", errors: project.errors });
    AccessorAnalyzer.analyze(routes);
    return routes;
  };
}

const report = (props: {
  type: "error" | "warning";
  errors: IReflectOperationError[];
}): void => {
  const map: TreeMap<
    IReflectOperationError.Key,
    Array<string | IOperationMetadata.IError>
  > = new TreeMap();
  for (const e of props.errors)
    map.take(new IReflectOperationError.Key(e), () => []).push(...e.contents);

  const messages: string[] = [];
  for (const {
    first: { error },
    second: contents,
  } of map) {
    if (error.contents.length === 0) continue;
    const location: string = path.relative(process.cwd(), error.file);
    messages.push(
      [
        `${location} - `,
        error.class,
        ...(error.function !== null ? [`.${error.function}()`] : [""]),
        // an empty origin names no part of the function
        ...(error.from ? [` from ${error.from}`] : [""]),
        ":\n",
        contents
          .map((c) => {
            if (typeof c === "string") return `  - ${c}`;
            else
              return [
                c.accessor
                  ? `  - ${c.name} (${c.accessor}): `
                  : `  - ${c.name}: `,
                ...c.messages.map((msg) => `    - ${msg}`),
              ].join("\n");
          })
          .join("\n"),
      ].join(""),
    );
  }
  throw new Error(
    `Error on NestiaSwaggerComposer.compose():\n${messages.join("\n\n")}`,
  );
};

const wrapPaths = (paths: string[]): string[] =>
  paths.length === 0 ? [""] : paths;
