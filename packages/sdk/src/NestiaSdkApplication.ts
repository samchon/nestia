import fs from "fs";
import path from "path";
import { HashSet, Pair, TreeMap } from "tstl";
import { IMetadataDictionary } from "typia/lib/schemas/metadata/IMetadataDictionary";

import { INestiaConfig } from "./INestiaConfig";
import { ConfigAnalyzer } from "./analyses/ConfigAnalyzer";
import { PathAnalyzer } from "./analyses/PathAnalyzer";
import { ReflectControllerAnalyzer } from "./analyses/ReflectControllerAnalyzer";
import { TypedHttpRouteAnalyzer } from "./analyses/TypedHttpRouteAnalyzer";
import { TypedWebSocketRouteAnalyzer } from "./analyses/TypedWebSocketRouteAnalyzer";
import { E2eGenerator } from "./generates/E2eGenerator";
import { OpenAiGenerator } from "./generates/OpenAiGenerator";
import { SdkGenerator } from "./generates/SdkGenerator";
import { SwaggerGenerator } from "./generates/SwaggerGenerator";
import { INestiaProject } from "./structures/INestiaProject";
import { IReflectController } from "./structures/IReflectController";
import { IReflectOperationError } from "./structures/IReflectOperationError";
import { ITypedApplication } from "./structures/ITypedApplication";
import { ITypedHttpRoute } from "./structures/ITypedHttpRoute";
import { ITypedWebSocketRoute } from "./structures/ITypedWebSocketRoute";
import { IOperationMetadata } from "./transformers/IOperationMetadata";
import { StringUtil } from "./utils/StringUtil";
import { VersioningStrategy } from "./utils/VersioningStrategy";

export class NestiaSdkApplication {
  public constructor(private readonly config: INestiaConfig) {}

  public async e2e(): Promise<void> {
    if (!this.config.output)
      throw new Error(
        "Error on NestiaApplication.e2e(): output path of SDK is not specified.",
      );
    else if (!this.config.e2e)
      throw new Error(
        "Error on NestiaApplication.e2e(): output path of e2e test files is not specified.",
      );

    const validate =
      (title: string) =>
      async (location: string): Promise<void> => {
        const parent: string = path.resolve(location + "/..");
        const stats: fs.Stats = await fs.promises.lstat(parent);
        if (stats.isDirectory() === false)
          throw new Error(
            `Error on NestiaApplication.e2e(): output directory of ${title} does not exists.`,
          );
      };
    await validate("sdk")(this.config.output);
    await validate("e2e")(this.config.e2e);

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
        "Error on NestiaApplication.sdk(): output path is not specified.",
      );

    const parent: string = path.resolve(this.config.output + "/..");
    const stats: fs.Stats = await fs.promises.lstat(parent);
    if (stats.isDirectory() === false)
      throw new Error(
        "Error on NestiaApplication.sdk(): output directory does not exists.",
      );

    print_title("Nestia SDK Generator");
    await this.generate({
      generate: SdkGenerator.generate,
      validate: SdkGenerator.validate,
    });
  }

  public async swagger(): Promise<void> {
    if (!this.config.swagger?.output)
      throw new Error(
        `Error on NestiaApplication.swagger(): output path of the "swagger.json" is not specified.`,
      );

    const parsed: path.ParsedPath = path.parse(this.config.swagger.output);
    const directory: string = !!parsed.ext
      ? path.resolve(parsed.dir)
      : this.config.swagger.output;
    const stats: fs.Stats = await fs.promises.lstat(directory);
    if (stats.isDirectory() === false)
      throw new Error(
        "Error on NestiaApplication.swagger(): output directory does not exists.",
      );

    print_title("Nestia Swagger Generator");
    await this.generate({
      generate: SwaggerGenerator.generate,
    });
  }

  public async openai(): Promise<void> {
    if (!this.config.openai?.output)
      throw new Error(
        `Error on NestiaApplication.openai(): output path of the "openai.json" is not specified.`,
      );

    const parsed: path.ParsedPath = path.parse(this.config.openai.output);
    const directory: string = !!parsed.ext
      ? path.resolve(parsed.dir)
      : this.config.openai.output;
    const stats: fs.Stats = await fs.promises.lstat(directory);
    if (stats.isDirectory() === false)
      throw new Error(
        "Error on NestiaApplication.openai(): output directory does not exists.",
      );

    print_title("Nestia OpenAI Function Calling Schema Generator");
    await this.generate({
      generate: OpenAiGenerator.generate,
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
      checker: null!,
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
          for (const operation of controller.operations)
            for (const operationPath of operation.paths)
              set.insert(
                new Pair(
                  `${controllerPath}/${operationPath}`,
                  operation.protocol === "http" ? operation.method : "",
                ),
              );
      return set.size();
    })();

    console.log(`  - controllers: #${controllers.length}`);
    console.log(`  - paths: #${agg}`);
    console.log(
      `  - routes: #${controllers
        .map(
          (c) =>
            c.paths.length *
            c.operations.map((f) => f.paths.length).reduce((a, b) => a + b, 0),
        )
        .reduce((a, b) => a + b, 0)}`,
    );

    //----
    // ANALYZE TYPESCRIPT CODE
    //----
    console.log("Analyzing soure codes");

    // METADATA COMPONENTS
    const collection: IMetadataDictionary =
      TypedHttpRouteAnalyzer.dictionary(controllers);

    // CONVERT TO TYPED OPERATIONS
    const globalPrefix: string = project.input.globalPrefix?.prefix ?? "";
    const routes: Array<ITypedHttpRoute | ITypedWebSocketRoute> = [];
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
        else if (o.protocol === "websocket")
          routes.push(
            ...TypedWebSocketRouteAnalyzer.analyze({
              controller: c,
              operation: o,
              paths: Array.from(pathList),
            }),
          );
      }
    if (props.validate !== undefined)
      props.validate({
        project,
        routes,
      });
    if (project.errors.length)
      return report({
        type: "error",
        errors: project.errors,
      });
    await props.generate({
      project,
      routes,
    });
  }
}

const print_title = (str: string): void => {
  console.log("-----------------------------------------------------------");
  console.log(` ${str}`);
  console.log("-----------------------------------------------------------");
};

// const is_implicit_return_typed = (route: ITypedHttpRoute): boolean => {
//   const name: string = route.output.typeName;
//   if (name === "void") return false;
//   else if (name.indexOf("readonly [") !== -1) return true;

//   const pos: number = name.indexOf("__object");
//   if (pos === -1) return false;

//   const before: number = pos - 1;
//   const after: number = pos + "__object".length;
//   for (const i of [before, after])
//     if (name[i] === undefined) continue;
//     else if (VARIABLE.test(name[i])) return false;
//   return true;
// };

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
    ].join("");
    console.log(message);
  }

  // for (const [file, cMap] of map) {
  //   for (const [controller, fMap] of cMap)
  //     for (const [func, messages] of fMap) {
  //       const location: string = path.relative(process.cwd(), file);
  //       console.log(
  //         `${location} - ${
  //           func !== null ? `${controller}.${func}()` : controller
  //         }`,
  //       );
  //       for (const msg of messages) console.log(`  - ${msg}`);
  //       console.log("");
  //     }
  // }
};

const wrapPaths = (paths: string[]): string[] =>
  paths.length === 0 ? [""] : paths;
