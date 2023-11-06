import fs from "fs";
import path from "path";
import ts from "typescript";

import { INestiaConfig } from "./INestiaConfig";
import { AccessorAnalyzer } from "./analyses/AccessorAnalyzer";
import { ConfigAnalyzer } from "./analyses/ConfigAnalyzer";
import { ControllerAnalyzer } from "./analyses/ControllerAnalyzer";
import { ReflectAnalyzer } from "./analyses/ReflectAnalyzer";
import { E2eGenerator } from "./generates/E2eGenerator";
import { SdkGenerator } from "./generates/SdkGenerator";
import { SwaggerGenerator } from "./generates/SwaggerGenerator";
import { IController } from "./structures/IController";
import { IErrorReport } from "./structures/IErrorReport";
import { INestiaProject } from "./structures/INestiaProject";
import { IRoute } from "./structures/IRoute";
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
        await this.generate(
            "e2e",
            (config) => config,
            (checker) => (config) => async (routes) => {
                await SdkGenerator.generate(checker)(config)(routes);
                await E2eGenerator.generate(config)(routes);
            },
        );
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
        await this.generate("sdk", (config) => config, SdkGenerator.generate);
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
        await this.generate(
            "swagger",
            (config) => config.swagger!,
            SwaggerGenerator.generate,
        );
    }

    private async generate<Config>(
        method: string,
        config: (entire: INestiaConfig) => Config,
        archiver: (
            checker: ts.TypeChecker,
        ) => (config: Config) => (routes: IRoute[]) => Promise<void>,
    ): Promise<void> {
        // ANALYZE REFLECTS
        const unique: WeakSet<any> = new WeakSet();
        const controllers: IController[] = [];
        const project: INestiaProject = {
            config: this.config,
            input: await ConfigAnalyzer.input(this.config),
            checker: null!,
            errors: [],
            warnings: [],
        };

        console.log("Analyzing reflections");
        for (const include of (await ConfigAnalyzer.input(this.config)).include)
            controllers.push(
                ...(await ReflectAnalyzer.analyze(project)(
                    unique,
                    include.file,
                    include.paths,
                    include.controller,
                )),
            );

        const agg: number = (() => {
            const set: Set<string> = new Set();
            for (const c of controllers)
                for (const cPath of c.paths)
                    for (const f of c.functions)
                        for (const fPath of f.paths)
                            set.add(`${f.method}::${cPath}/${fPath}`);
            return set.size;
        })();

        console.log(`  - controllers: #${controllers.length}`);
        console.log(`  - paths: #${agg}`);
        console.log(
            `  - routes: #${controllers
                .map(
                    (c) =>
                        c.paths.length *
                        c.functions
                            .map((f) => f.paths.length)
                            .reduce((a, b) => a + b, 0),
                )
                .reduce((a, b) => a + b, 0)}`,
        );

        // ANALYZE TYPESCRIPT CODE
        console.log("Analyzing source codes");
        const program: ts.Program = ts.createProgram(
            controllers.map((c) => c.file),
            this.compilerOptions,
        );
        project.checker = program.getTypeChecker();

        const routeList: IRoute[] = [];
        for (const c of controllers) {
            const file: ts.SourceFile | undefined = program.getSourceFile(
                c.file,
            );
            if (file === undefined) continue;
            routeList.push(
                ...(await ControllerAnalyzer.analyze(project)(file, c)),
            );
        }

        // REPORT ERRORS
        if (project.errors.length) {
            report_errors("error")(project.errors);
            process.exit(-1);
        }
        if (project.warnings.length) report_errors("warning")(project.warnings);

        // FIND IMPLICIT TYPES
        const implicit: IRoute[] = routeList.filter(is_implicit_return_typed);
        if (implicit.length > 0)
            throw new Error(
                `NestiaApplication.${method}(): implicit return type is not allowed.\n` +
                    "\n" +
                    "List of implicit return typed routes:\n" +
                    implicit
                        .map(
                            (it) =>
                                `  - ${it.symbol.class}.${it.symbol.function} at "${it.location}"`,
                        )
                        .join("\n"),
            );

        // DO GENERATE
        AccessorAnalyzer.analyze(routeList);
        await archiver(project.checker)(config(this.config))(routeList);
    }
}

const print_title = (str: string): void => {
    console.log("-----------------------------------------------------------");
    console.log(` ${str}`);
    console.log("-----------------------------------------------------------");
};

const is_implicit_return_typed = (route: IRoute): boolean => {
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
        const map: Map<
            string,
            Map<string, Map<string, Set<string>>>
        > = new Map();
        for (const e of errors) {
            const file = MapUtil.take(map, e.file, () => new Map());
            const controller = MapUtil.take(
                file,
                e.controller,
                () => new Map(),
            );
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
                            func !== null
                                ? `${controller}.${func}()`
                                : controller
                        }`,
                    );
                    for (const msg of messages) console.log(`  - ${msg}`);
                    console.log("");
                }
        }
    };

const VARIABLE = /[a-zA-Z_$0-9]/;
