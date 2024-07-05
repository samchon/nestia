import transform from "@nestia/core/lib/transform";
import fs from "fs";
import path from "path";
import ts from "typescript";

import { INestiaConfig } from "./INestiaConfig";
import { AccessorAnalyzer } from "./analyses/AccessorAnalyzer";
import { ConfigAnalyzer } from "./analyses/ConfigAnalyzer";
import { ReflectControllerAnalyzer } from "./analyses/ReflectControllerAnalyzer";
import { TypedControllerAnalyzer } from "./analyses/TypedControllerAnalyzer";
import { E2eGenerator } from "./generates/E2eGenerator";
import { SdkGenerator } from "./generates/SdkGenerator";
import { SwaggerGenerator } from "./generates/SwaggerGenerator";
import { IErrorReport } from "./structures/IErrorReport";
import { INestiaProject } from "./structures/INestiaProject";
import { IReflectController } from "./structures/IReflectController";
import { ITypedHttpRoute } from "./structures/ITypedHttpRoute";
import { ITypedWebSocketRoute } from "./structures/ITypedWebSocketRoute";
import { MapUtil } from "./utils/MapUtil";

export class NestiaSdkApplication {
  public constructor(
    private readonly config: INestiaConfig,
    private readonly compilerOptions: ts.CompilerOptions,
  ) {}

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
    await this.generate("e2e", (project) => async (routes) => {
      await SdkGenerator.generate(project)(routes);
      await E2eGenerator.generate(project)(
        routes.filter((r) => r.protocol === "http") as ITypedHttpRoute[],
      );
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
    await this.generate("sdk", SdkGenerator.generate);
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
    await this.generate("swagger", SwaggerGenerator.generate);
  }

  private async generate(
    method: string,
    archiver: (
      project: INestiaProject,
    ) => (
      routes: Array<ITypedHttpRoute | ITypedWebSocketRoute>,
    ) => Promise<void>,
  ): Promise<void> {
    //----
    // ANALYZE REFLECTS
    //----
    const unique: WeakSet<any> = new WeakSet();
    const controllers: IReflectController[] = [];
    const project: INestiaProject = {
      config: this.config,
      input: await ConfigAnalyzer.input(this.config),
      checker: null!,
      errors: [],
      warnings: [],
    };

    console.log("Analyzing reflections");
    await turnTransformError(false);
    for (const include of (await ConfigAnalyzer.input(this.config)).include)
      controllers.push(
        ...(await ReflectControllerAnalyzer.analyze(project)(
          unique,
          include.file,
          include.paths,
          include.controller,
        )),
      );
    await turnTransformError(true);

    const agg: number = (() => {
      const set: Set<string> = new Set();
      for (const c of controllers)
        for (const cPath of c.paths)
          for (const op of c.operations)
            for (const fPath of op.paths)
              set.add(
                `${op.protocol === "http" ? `${op.method}::` : ""}${cPath}/${fPath}`,
              );
      return set.size;
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
    console.log("Analyzing source codes");

    const program: ts.Program = ts.createProgram(
      controllers.map((c) => c.file),
      this.compilerOptions,
    );
    project.checker = program.getTypeChecker();

    const diagnostics: ts.Diagnostic[] = [];
    ts.transform(
      program
        .getSourceFiles()
        .filter((file) => false === file.isDeclarationFile),
      [
        transform(
          program,
          ((this.compilerOptions.plugins as any) ?? []).find(
            (p: any) => p.transform === "@nestia/core/lib/transform",
          ) ?? {},
          {
            addDiagnostic: (diag) => diagnostics.push(diag),
          },
        ),
      ],
      program.getCompilerOptions(),
    );

    const routeList: Array<ITypedHttpRoute | ITypedWebSocketRoute> = [];
    for (const c of controllers) {
      const file: ts.SourceFile | undefined = program.getSourceFile(c.file);
      if (file === undefined) continue;
      routeList.push(
        ...(await TypedControllerAnalyzer.analyze(project)(file, c)),
      );
    }

    // TRACE ERRORS
    for (const diag of diagnostics) {
      const file: string = diag.file
        ? path.relative(diag.file.fileName, process.cwd())
        : "(unknown file)";
      const category: string =
        diag.category === ts.DiagnosticCategory.Warning
          ? "warning"
          : diag.category === ts.DiagnosticCategory.Error
            ? "error"
            : diag.category === ts.DiagnosticCategory.Suggestion
              ? "suggestion"
              : diag.category === ts.DiagnosticCategory.Message
                ? "message"
                : "unkown";
      const [line, pos] = diag.file
        ? (() => {
            const lines: string[] = diag
              .file!.text.substring(0, diag.start)
              .split("\n");
            if (lines.length === 0) return [0, 0];
            return [lines.length, lines.at(-1)!.length + 1];
          })()
        : [0, 0];
      console.error(
        `${file}:${line}:${pos} - ${category} TS${diag.code}: ${diag.messageText}`,
      );
    }
    if (diagnostics.length) process.exit(-1);

    // REPORT ERRORS
    if (project.errors.length) {
      report_errors("error")(project.errors);
      process.exit(-1);
    }
    if (project.warnings.length) report_errors("warning")(project.warnings);

    // FIND IMPLICIT TYPES
    if (this.config.clone !== true) {
      const implicit: ITypedHttpRoute[] = routeList.filter(
        (r) => r.protocol === "http" && is_implicit_return_typed(r),
      ) as ITypedHttpRoute[];
      if (implicit.length > 0)
        throw new Error(
          `NestiaApplication.${method}(): implicit return type is not allowed.\n` +
            "\n" +
            "List of implicit return typed routes:\n" +
            implicit
              .map(
                (it) =>
                  `  - ${it.controller.name}.${it.name} at "${it.location}"`,
              )
              .join("\n"),
        );
    }

    // DO GENERATE
    AccessorAnalyzer.analyze(routeList);
    await archiver(project)(routeList);
  }
}

const print_title = (str: string): void => {
  console.log("-----------------------------------------------------------");
  console.log(` ${str}`);
  console.log("-----------------------------------------------------------");
};

const is_implicit_return_typed = (route: ITypedHttpRoute): boolean => {
  const name: string = route.output.typeName;
  if (name === "void") return false;
  else if (name.indexOf("readonly [") !== -1) return true;

  const pos: number = name.indexOf("__object");
  if (pos === -1) return false;

  const before: number = pos - 1;
  const after: number = pos + "__object".length;
  for (const i of [before, after])
    if (name[i] === undefined) continue;
    else if (VARIABLE.test(name[i])) return false;
  return true;
};

const report_errors =
  (type: "error" | "warning") =>
  (errors: IErrorReport[]): void => {
    // key: file
    // key: controller
    // key: function
    // value: message
    const map: Map<string, Map<string, Map<string, Set<string>>>> = new Map();
    for (const e of errors) {
      const file = MapUtil.take(map, e.file, () => new Map());
      const controller = MapUtil.take(file, e.controller, () => new Map());
      const func = MapUtil.take(controller, e.function, () => new Set());
      func.add(e.message);
    }

    console.log("");
    print_title(`Nestia ${type[0].toUpperCase()}${type.slice(1)} Report`);
    for (const [file, cMap] of map) {
      for (const [controller, fMap] of cMap)
        for (const [func, messages] of fMap) {
          const location: string = path.relative(process.cwd(), file);
          console.log(
            `${location} - ${
              func !== null ? `${controller}.${func}()` : controller
            }`,
          );
          for (const msg of messages) console.log(`  - ${msg}`);
          console.log("");
        }
    }
  };

const VARIABLE = /[a-zA-Z_$0-9]/;
const turnTransformError = async (flag: boolean): Promise<void> => {
  try {
    const modulo = await import(
      "@nestia/core/lib/decorators/internal/NoTransformConfigureError" as string
    );
    modulo.NoTransformConfigureError.throws = flag;
  } catch {}
};
