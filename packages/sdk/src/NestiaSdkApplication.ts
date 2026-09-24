import fs from "fs";
import path from "path";
import { HashSet, Pair, TreeMap } from "tstl";

import { INestiaConfig } from "./INestiaConfig";
import { AccessorAnalyzer } from "./analyses/AccessorAnalyzer";
import { ConfigAnalyzer } from "./analyses/ConfigAnalyzer";
import { PathAnalyzer } from "./analyses/PathAnalyzer";
import { ReflectControllerAnalyzer } from "./analyses/ReflectControllerAnalyzer";
import { TypedHttpRouteAnalyzer } from "./analyses/TypedHttpRouteAnalyzer";
import { TypedMcpRouteAnalyzer } from "./analyses/TypedMcpRouteAnalyzer";
import { TypedWebSocketRouteAnalyzer } from "./analyses/TypedWebSocketRouteAnalyzer";
import { E2eGenerator } from "./generates/E2eGenerator";
import { SdkGenerator } from "./generates/SdkGenerator";
import { SwaggerGenerator } from "./generates/SwaggerGenerator";
import { IMetadataDictionary } from "./internal/legacy";
import { INestiaProject } from "./structures/INestiaProject";
import { IOperationMetadata } from "./structures/IOperationMetadata";
import { IReflectController } from "./structures/IReflectController";
import { IReflectOperationError } from "./structures/IReflectOperationError";
import { ITypedApplication } from "./structures/ITypedApplication";
import { ITypedHttpRoute } from "./structures/ITypedHttpRoute";
import { ITypedMcpRoute } from "./structures/ITypedMcpRoute";
import { ITypedWebSocketRoute } from "./structures/ITypedWebSocketRoute";
import { StringUtil } from "./utils/StringUtil";
import { VersioningStrategy } from "./utils/VersioningStrategy";

export class NestiaSdkApplication {
  public constructor(private readonly config: INestiaConfig) {}

  public async all(): Promise<void> {
    if (!this.config.output && !this.config.swagger?.output)
      throw new Error(
        [
          "Error on NestiaApplication.all(): nothing to generate, configure at least one property of below:",
          "",
          "  - INestiaConfig.output",
          "  - INestiaConfig.swagger.output",
          "  - INestiaConfig.openai.output",
        ].join("\n"),
      );
    print_title("Nestia All Generator");
    await this.generate({
      generate: async (app) => {
        if (this.config.output) {
          await SdkGenerator.generate(app);
          if (this.config.e2e) await E2eGenerator.generate(app);
        }
        if (this.config.swagger) await SwaggerGenerator.generate(app);
      },
      validate: this.config.output ? SdkGenerator.validate : undefined,
    });
  }

  public async e2e(): Promise<void> {
    if (!this.config.output)
      throw new Error(
        "Error on NestiaApplication.e2e(): configure INestiaConfig.output property.",
      );
    else if (!this.config.e2e)
      throw new Error(
        "Error on NestiaApplication.e2e(): configure INestiaConfig.e2e property.",
      );

    await assertDirectory({
      method: "e2e",
      property: "output",
      location: this.config.output,
      directory: path.resolve(this.config.output + "/.."),
    });
    await assertDirectory({
      method: "e2e",
      property: "e2e",
      location: this.config.e2e,
      directory: path.resolve(this.config.e2e + "/.."),
    });

    print_title("Nestia E2E Generator");
    await this.generate({
      generate: async (app) => {
        await SdkGenerator.generate(app);
        await E2eGenerator.generate(app);
      },
    });
  }

  public async sdk(): Promise<void> {
    if (!this.config.output)
      throw new Error(
        "Error on NestiaApplication.sdk(): configure INestiaConfig.output property.",
      );

    await assertDirectory({
      method: "sdk",
      property: "output",
      location: this.config.output,
      directory: path.resolve(this.config.output + "/.."),
    });

    print_title("Nestia SDK Generator");
    await this.generate({
      generate: SdkGenerator.generate,
      validate: SdkGenerator.validate,
    });
  }

  public async swagger(): Promise<void> {
    if (!this.config.swagger?.output)
      throw new Error(
        `Error on NestiaApplication.swagger(): configure INestiaConfig.swagger property.`,
      );

    const parsed: path.ParsedPath = path.parse(this.config.swagger.output);
    await assertDirectory({
      method: "swagger",
      property: "swagger.output",
      location: this.config.swagger.output,
      directory: !!parsed.ext
        ? path.resolve(parsed.dir)
        : path.resolve(this.config.swagger.output),
    });

    print_title("Nestia Swagger Generator");
    await this.generate({
      generate: SwaggerGenerator.generate,
    });
  }

  private async generate(props: {
    generate: (app: ITypedApplication) => Promise<void>;
    validate?: (app: ITypedApplication) => IReflectOperationError[];
  }): Promise<void> {
    //----
    // ANALYZE REFLECTS
    //----
    const unique: WeakSet<any> = new WeakSet();
    const project: INestiaProject = {
      config: this.config,
      input: await ConfigAnalyzer.input(this.config),
      errors: [],
      warnings: [],
    };

    console.log("Analyzing reflections");
    const controllers: IReflectController[] = project.input.controllers
      .map((c) =>
        ReflectControllerAnalyzer.analyze({ project, controller: c, unique }),
      )
      .filter((c): c is IReflectController => c !== null);

    if (project.warnings.length)
      report({
        type: "warning",
        errors: project.warnings,
      });
    if (project.errors.length)
      return report({
        type: "error",
        errors: project.errors,
      });

    const agg: number = (() => {
      const set: HashSet<Pair<string, string>> = new HashSet();
      for (const controller of controllers)
        for (const controllerPath of controller.paths)
          for (const operation of controller.operations) {
            if (operation.protocol === "mcp") {
              set.insert(new Pair(`mcp:${operation.toolName}`, "mcp"));
              continue;
            }
            for (const operationPath of operation.paths)
              set.insert(
                new Pair(
                  `${controllerPath}/${operationPath}`,
                  operation.protocol === "http" ? operation.method : "",
                ),
              );
          }
      return set.size();
    })();

    console.log(`  - controllers: #${controllers.length}`);
    console.log(`  - paths: #${agg}`);
    console.log(
      `  - routes: #${controllers
        .map(
          (c) =>
            c.paths.length *
            c.operations
              .map((f) => (f.protocol === "mcp" ? 1 : f.paths.length))
              .reduce((a, b) => a + b, 0),
        )
        .reduce((a, b) => a + b, 0)}`,
    );

    //----
    // ANALYZE TYPESCRIPT CODE
    //----
    console.log("Analyzing source codes");

    // METADATA COMPONENTS
    const sourceCollection: IMetadataDictionary =
      TypedHttpRouteAnalyzer.dictionary(controllers);

    // CONVERT TO TYPED OPERATIONS
    const routes: Array<
      ITypedHttpRoute | ITypedWebSocketRoute | ITypedMcpRoute
    > = [];
    for (const c of controllers)
      for (const o of c.operations) {
        if (o.protocol === "mcp") {
          routes.push(
            ...TypedMcpRouteAnalyzer.analyze({
              controller: c,
              operation: o,
            }),
          );
          continue;
        }
        const pathList: Set<string> = new Set();
        const versions: string[] = VersioningStrategy.merge(project)([
          ...(c.versions ?? []),
          ...(o.versions ?? []),
        ]);
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
                    method: o.protocol === "http" ? o.method : "",
                    path: PathAnalyzer.join(v, localPath),
                  }),
                );
              }
        if (o.protocol === "http")
          routes.push(
            ...TypedHttpRouteAnalyzer.analyze({
              controller: c,
              errors: project.errors,
              dictionary: sourceCollection,
              operation: o,
              paths: Array.from(pathList),
            }),
          );
        else if (o.protocol === "websocket")
          routes.push(
            ...TypedWebSocketRouteAnalyzer.analyze({
              controller: c,
              operation: o,
              paths: Array.from(pathList),
            }),
          );
      }
    AccessorAnalyzer.analyze(routes);

    const collection: IMetadataDictionary =
      TypedHttpRouteAnalyzer.routeDictionary(
        routes.filter((r): r is ITypedHttpRoute => r.protocol === "http"),
      );

    if (props.validate !== undefined)
      project.errors.push(
        ...props.validate({
          project,
          collection,
          routes,
        }),
      );
    if (project.errors.length)
      return report({
        type: "error",
        errors: project.errors,
      });
    await props.generate({
      project,
      collection,
      routes,
    });
  }
}

/**
 * Asserts the directory an output is written into exists, naming the configured
 * location. `fs.promises.stat()` itself rejects a missing path, so it is caught
 * rather than left to surface as a bare `ENOENT`; a symbolic link to a
 * directory is followed.
 */
const assertDirectory = async (props: {
  method: string;
  property: string;
  location: string;
  directory: string;
}): Promise<void> => {
  const stats: fs.Stats | null = await fs.promises
    .stat(props.directory)
    .catch((error: NodeJS.ErrnoException): null => {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
      throw error;
    });
  if (stats === null || stats.isDirectory() === false)
    throw new Error(
      `Error on NestiaApplication.${props.method}(): directory ${JSON.stringify(props.directory)} of INestiaConfig.${props.property} ${JSON.stringify(props.location)} ${stats === null ? "does not exist" : "is not a directory"}.`,
    );
};

const print_title = (str: string): void => {
  console.log("-----------------------------------------------------------");
  console.log(` ${str}`);
  console.log("-----------------------------------------------------------");
};

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

  console.log("");
  print_title(`Nestia ${StringUtil.capitalize(props.type)} Report`);

  // every contradiction at once, not only the first function's
  const messages: string[] = [];
  for (const {
    first: { error },
    second: contents,
  } of map) {
    if (error.contents.length === 0) continue;
    const location: string = path.relative(process.cwd(), error.file);
    const message: string = [
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
              // the property the type was found at, when there is one
              c.accessor
                ? `  - ${c.name} (${c.accessor}): `
                : `  - ${c.name}: `,
              ...c.messages.map((msg) => `    - ${msg}`),
            ].join("\n");
        })
        .join("\n"),
    ].join("");
    if (props.type === "error") messages.push(message);
    else console.log(message);
  }
  if (messages.length !== 0) throw new Error(messages.join("\n\n"));
};

const wrapPaths = (paths: string[]): string[] =>
  paths.length === 0 ? [""] : paths;
