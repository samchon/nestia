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
import { IRoute } from "./structures/IRoute";

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

        title("Nestia E2E Generator");
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

        title("Nestia SDK Generator");
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

        title("Nestia Swagger Generator");
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

        console.log("Analyzing reflections");
        for (const include of (await ConfigAnalyzer.input(this.config)).include)
            controllers.push(
                ...(await ReflectAnalyzer.analyze(
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
        const checker: ts.TypeChecker = program.getTypeChecker();

        const routeList: IRoute[] = [];
        for (const c of controllers) {
            const file: ts.SourceFile | undefined = program.getSourceFile(
                c.file,
            );
            if (file === undefined) continue;
            routeList.push(
                ...(await ControllerAnalyzer.analyze(
                    this.config,
                    checker,
                    file,
                    c,
                )),
            );
        }

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
        await archiver(checker)(config(this.config))(routeList);
    }
}

const title = (str: string): void => {
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

const VARIABLE = /[a-zA-Z_$0-9]/;
