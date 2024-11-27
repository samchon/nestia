import { INestApplication } from "@nestjs/common";
import { OpenApi, OpenApiV3, SwaggerV2 } from "@samchon/openapi";
import path from "path";
import { TreeMap } from "tstl";
import { IMetadataDictionary } from "typia/lib/schemas/metadata/IMetadataDictionary";

import { INestiaConfig } from "./INestiaConfig";
import { AccessorAnalyzer } from "./analyses/AccessorAnalyzer";
import { ConfigAnalyzer } from "./analyses/ConfigAnalyzer";
import { PathAnalyzer } from "./analyses/PathAnalyzer";
import { ReflectControllerAnalyzer } from "./analyses/ReflectControllerAnalyzer";
import { TypedHttpRouteAnalyzer } from "./analyses/TypedHttpRouteAnalyzer";
import { SwaggerGenerator } from "./generates/SwaggerGenerator";
import { INestiaProject } from "./structures/INestiaProject";
import { INestiaSdkInput } from "./structures/INestiaSdkInput";
import { IReflectController } from "./structures/IReflectController";
import { IReflectOperationError } from "./structures/IReflectOperationError";
import { ITypedHttpRoute } from "./structures/ITypedHttpRoute";
import { IOperationMetadata } from "./transformers/IOperationMetadata";
import { VersioningStrategy } from "./utils/VersioningStrategy";

export namespace NestiaSwaggerComposer {
  export const document = async (
    app: INestApplication,
    config: Omit<INestiaConfig.ISwaggerConfig, "output">,
  ): Promise<OpenApi.IDocument | OpenApiV3.IDocument | SwaggerV2.IDocument> => {
    const input: INestiaSdkInput = await ConfigAnalyzer.application(app);
    const document: OpenApi.IDocument = await SwaggerGenerator.compose({
      config,
      routes: analyze(input),
      document: await SwaggerGenerator.initialize(config),
    });
    return config.openapi === "2.0"
      ? OpenApi.downgrade(document, "2.0")
      : config.openapi === "3.0"
        ? OpenApi.downgrade(document, "3.0")
        : document;
  };

  const analyze = (input: INestiaSdkInput): ITypedHttpRoute[] => {
    // GET REFLECT CONTROLLERS
    const unique: WeakSet<any> = new WeakSet();
    const project: Omit<INestiaProject, "config"> = {
      input,
      checker: null!,
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

    // METADATA COMPONENTS
    const collection: IMetadataDictionary =
      TypedHttpRouteAnalyzer.dictionary(controllers);

    // CONVERT TO TYPED OPERATIONS
    const globalPrefix: string = project.input.globalPrefix?.prefix ?? "";
    const routes: ITypedHttpRoute[] = [];
    for (const c of controllers)
      for (const o of c.operations) {
        const pathList: Set<string> = new Set();
        const versions: string[] = VersioningStrategy.merge(project)([
          ...(c.versions ?? []),
          ...(o.versions ?? []),
        ]);
        for (const v of versions)
          for (const prefix of wrapPaths(c.prefixes))
            for (const cPath of wrapPaths(c.paths))
              for (const filePath of wrapPaths(o.paths))
                pathList.add(
                  PathAnalyzer.join(globalPrefix, v, prefix, cPath, filePath),
                );
        if (o.protocol === "http")
          routes.push(
            ...TypedHttpRouteAnalyzer.analyze({
              controller: c,
              errors: project.errors,
              dictionary: collection,
              operation: o,
              paths: Array.from(pathList),
            }),
          );
      }
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
        ...(error.from !== null ? [` from ${error.from}`] : [""]),
        ":\n",
        contents
          .map((c) => {
            if (typeof c === "string") return `  - ${c}`;
            else
              return [
                c.accessor
                  ? `  - ${c.name}: `
                  : `  - ${c.name} (${c.accessor}): `,
                ...c.messages.map((msg) => `    - ${msg}`),
              ].join("\n");
          })
          .join("\n"),
      ].join(""),
    );
  }
  throw new Error(`Error on NestiaSwaggerComposer.compose():\n${messages}`);
};

const wrapPaths = (paths: string[]): string[] =>
  paths.length === 0 ? [""] : paths;
