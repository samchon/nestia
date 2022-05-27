import fs from "fs";
import path from "path";
import * as runner from "ts-node";
import ts from "typescript";
import { Pair } from "tstl/utility/Pair";
import { Singleton } from "tstl/thread/Singleton";

import { ControllerAnalyzer } from "./analyses/ControllerAnalyzer";
import { ReflectAnalyzer } from "./analyses/ReflectAnalyzer";
import { SourceFinder } from "./analyses/SourceFinder";
import { SdkGenerator } from "./generates/SdkGenerator";
import { SwaggerGenerator } from "./generates/SwaggerGenerator";

import { ArrayUtil } from "./utils/ArrayUtil";
import { CompilerOptions } from "./executable/internal/CompilerOptions";

import { IConfiguration } from "./IConfiguration";
import { IController } from "./structures/IController";
import { IRoute } from "./structures/IRoute";

export class NestiaApplication {
    private readonly config_: IConfiguration;
    private readonly bundle_checker_: Singleton<
        Promise<(str: string) => boolean>
    >;

    public constructor(config: IConfiguration) {
        this.config_ = config;
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

        await this.generate((config) => config, SdkGenerator.generate);
    }

    public async swagger(): Promise<void> {
        if (!this.config_.swagger || !this.config_.swagger.output)
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

        await this.generate(
            (config) => config.swagger!,
            SwaggerGenerator.generate,
        );
    }

    private async generate<Config>(
        config: (entire: IConfiguration) => Config,
        archiver: (
            checker: ts.TypeChecker,
            config: Config,
            routes: IRoute[],
        ) => Promise<void>,
    ): Promise<void> {
        // MOUNT TS-NODE
        this.prepare();

        // LOAD CONTROLLER FILES
        const input: IConfiguration.IInput =
            this.config_.input instanceof Array
                ? { include: this.config_.input }
                : typeof this.config_.input === "string"
                ? { include: [this.config_.input] }
                : this.config_.input;
        const fileList: string[] = await ArrayUtil.asyncFilter(
            await SourceFinder.find(input),
            (file) => this.is_not_excluded(file),
        );

        // ANALYZE REFLECTS
        const unique: WeakSet<any> = new WeakSet();
        const controllerList: IController[] = [];

        for (const file of fileList)
            controllerList.push(
                ...(await ReflectAnalyzer.analyze(unique, file)),
            );

        // ANALYZE TYPESCRIPT CODE
        const program: ts.Program = ts.createProgram(
            controllerList.map((c) => c.file),
            this.config_.compilerOptions || { noEmit: true },
        );
        const checker: ts.TypeChecker = program.getTypeChecker();

        const routeList: IRoute[] = [];
        for (const controller of controllerList) {
            const sourceFile: ts.SourceFile | undefined = program.getSourceFile(
                controller.file,
            );
            if (sourceFile === undefined) continue;

            routeList.push(
                ...ControllerAnalyzer.analyze(checker, sourceFile, controller),
            );
        }

        // DO GENERATE
        await archiver(checker, config(this.config_), routeList);
    }

    private prepare(): void {
        // CONSTRUCT OPTIONS
        const predicator: () => [boolean, boolean] = this.config_
            .compilerOptions
            ? () =>
                  CompilerOptions.emend(
                      this.config_.compilerOptions!,
                      !!this.config_.assert,
                  )
            : () => {
                  this.config_.compilerOptions = (<any>(
                      CompilerOptions.DEFAULT_OPTIONS
                  )) as ts.CompilerOptions;
                  return [false, false];
              };

        // MOUNT TS-NODE
        const [transformed, absoluted] = predicator();
        runner.register({
            emit: false,
            compiler: transformed ? "ttypescript" : "typescript",
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
