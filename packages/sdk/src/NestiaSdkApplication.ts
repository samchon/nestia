import fs from "fs";
import path from "path";
import * as runner from "ts-node";
import { Pair, Singleton } from "tstl";
import ts from "typescript";

import { INestiaConfig } from "./INestiaConfig";
import { AccessorAnalyzer } from "./analyses/AccessorAnalyzer";
import { ControllerAnalyzer } from "./analyses/ControllerAnalyzer";
import { ReflectAnalyzer } from "./analyses/ReflectAnalyzer";
import { NestiaConfigCompilerOptions } from "./executable/internal/NestiaConfigCompilerOptions";
import { E2eGenerator } from "./generates/E2eGenerator";
import { SdkGenerator } from "./generates/SdkGenerator";
import { SwaggerGenerator } from "./generates/SwaggerGenerator";
import { IController } from "./structures/IController";
import { IRoute } from "./structures/IRoute";
import { ArrayUtil } from "./utils/ArrayUtil";
import { NestiaConfigUtil } from "./utils/NestiaConfigUtil";
import { SourceFinder } from "./utils/SourceFinder";

export class NestiaSdkApplication {
    private readonly bundle_checker_: Singleton<
        Promise<(str: string) => boolean>
    >;

    public constructor(private readonly config_: INestiaConfig) {
        this.bundle_checker_ = new Singleton(async () => {
            if (!this.config_.output) return () => false;

            const bundles: string[] = await fs.promises.readdir(
                SdkGenerator.BUNDLE_PATH,
            );
            const tuples: Pair<string, boolean>[] = await ArrayUtil.asyncMap(
                bundles,
                async (file) => {
                    const relative: string = path.join(
                        this.config_.output!,
                        file,
                    );
                    const location: string = path.join(
                        SdkGenerator.BUNDLE_PATH,
                        file,
                    );
                    const stats: fs.Stats = await fs.promises.stat(location);

                    return new Pair(relative, stats.isDirectory());
                },
            );

            return (file: string): boolean => {
                for (const it of tuples)
                    if (it.second === false && file === it.first) return true;
                    else if (it.second === true && file.indexOf(it.first) === 0)
                        return true;
                return false;
            };
        });
    }

    public async e2e(): Promise<void> {
        if (!this.config_.output)
            throw new Error(
                "Error on NestiaApplication.e2e(): output path of SDK is not specified.",
            );
        else if (!this.config_.e2e)
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
        await validate("sdk")(this.config_.output);
        await validate("e2e")(this.config_.e2e);

        title("Nestia E2E Generator");
        await this.generate(
            "e2e",
            (config) => config,
            () => (config) => async (routes) => {
                await SdkGenerator.generate(config)(routes);
                await E2eGenerator.generate(config)(routes);
            },
        );
    }

    public async sdk(): Promise<void> {
        if (!this.config_.output)
            throw new Error(
                "Error on NestiaApplication.sdk(): output path is not specified.",
            );

        const parent: string = path.resolve(this.config_.output + "/..");
        const stats: fs.Stats = await fs.promises.lstat(parent);
        if (stats.isDirectory() === false)
            throw new Error(
                "Error on NestiaApplication.sdk(): output directory does not exists.",
            );

        title("Nestia SDK Generator");
        await this.generate(
            "sdk",
            (config) => config,
            () => SdkGenerator.generate,
        );
    }

    public async swagger(): Promise<void> {
        if (!this.config_.swagger?.output)
            throw new Error(
                `Error on NestiaApplication.swagger(): output path of the "swagger.json" is not specified.`,
            );

        const parsed: path.ParsedPath = path.parse(this.config_.swagger.output);
        const directory: string = !!parsed.ext
            ? path.resolve(parsed.dir)
            : this.config_.swagger.output;
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
        // MOUNT TS-NODE
        this.prepare(method);

        // LOAD CONTROLLER FILES
        const input: INestiaConfig.IInput = NestiaConfigUtil.input(
            this.config_.input,
        );
        const fileList: string[] = await ArrayUtil.asyncFilter(
            await SourceFinder.find({
                include: input.include,
                exclude: input.exclude,
                filter: (file) =>
                    file.substring(file.length - 3) === ".ts" &&
                    file.substring(file.length - 5) !== ".d.ts",
            }),
            (file) => this.is_not_excluded(file),
        );

        // ANALYZE REFLECTS
        const unique: WeakSet<any> = new WeakSet();
        const controllers: IController[] = [];

        console.log("Analyzing reflections");
        for (const file of fileList)
            controllers.push(...(await ReflectAnalyzer.analyze(unique, file)));

        const agg: number = (() => {
            const set: Set<string> = new Set();
            for (const c of controllers)
                for (const cPath of c.paths)
                    for (const f of c.functions)
                        for (const method of f.methods)
                            for (const fPath of f.paths)
                                set.add(`${method}::${cPath}/${fPath}`);
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
            this.config_.compilerOptions || { noEmit: true },
        );
        const checker: ts.TypeChecker = program.getTypeChecker();

        const routeList: IRoute[] = [];
        for (const c of controllers) {
            const file: ts.SourceFile | undefined = program.getSourceFile(
                c.file,
            );
            if (file === undefined) continue;
            routeList.push(...ControllerAnalyzer.analyze(checker, file, c));
        }

        // FIND IMPLICIT TYPES
        const implicit: IRoute[] = routeList.filter(is_implicit_return_typed);
        if (implicit.length > 0)
            throw new Error(
                `NestiaApplication.${method}(): implicit return type is not allowed.\n` +
                    "\n" +
                    "List of implicit return typed routes:\n" +
                    implicit
                        .map((it) => `  - ${it.symbol} at "${it.location}"`)
                        .join("\n"),
            );

        // DO GENERATE
        AccessorAnalyzer.analyze(routeList);
        await archiver(checker)(config(this.config_))(routeList);
    }

    private prepare(method: string): void {
        // CONSTRUCT OPTIONS
        if (!this.config_.compilerOptions)
            this.config_.compilerOptions =
                NestiaConfigCompilerOptions.DEFAULT_OPTIONS as any;
        const absoluted: boolean = !!this.config_.compilerOptions?.baseUrl;

        // CHECK STRICT OPTION
        const strict: boolean =
            this.config_.compilerOptions?.strictNullChecks !== undefined
                ? !!this.config_.compilerOptions.strictNullChecks
                : !!this.config_.compilerOptions?.strict;
        if (strict === false)
            throw new Error(
                `Error on NestiaSdkApplication.${method}(): nestia requires \`compilerOptions.strictNullChecks\` to be true.`,
            );

        const ttsc: boolean =
            ts.version < "5.0.0" &&
            (() => {
                try {
                    require.resolve("ttypescript");
                    return true;
                } catch (e) {
                    return false;
                }
            })();

        // MOUNT TS-NODE
        runner.register({
            emit: false,
            compiler: ttsc ? "ttypescript" : undefined,
            compilerOptions: this.config_.compilerOptions,
            require: absoluted ? ["tsconfig-paths/register"] : undefined,
        });
    }

    private async is_not_excluded(file: string): Promise<boolean> {
        if (this.config_.output)
            return (
                file.indexOf(path.join(this.config_.output, "functional")) ===
                    -1 && (await this.bundle_checker_.get())(file) === false
            );

        const content: string = await fs.promises.readFile(file, "utf8");
        return (
            content.indexOf(
                " * @nestia Generated by Nestia - https://github.com/samchon/nestia",
            ) === -1
        );
    }
}

const title = (str: string): void => {
    console.log("-----------------------------------------------------------");
    console.log(` ${str}`);
    console.log("-----------------------------------------------------------");
};

const is_implicit_return_typed = (route: IRoute): boolean => {
    const name: string = route.output.name;
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
