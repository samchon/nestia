import * as fs from "fs";
import * as path from "path";
import * as runner from "ts-node";
import * as tsc from "typescript";
import { Pair } from "tstl/utility/Pair";
import { Singleton } from "tstl/thread/Singleton";

import { ControllerAnalyzer } from "./analyses/ControllerAnalyzer";
import { ReflectAnalyzer } from "./analyses/ReflectAnalyzer";
import { SourceFinder } from "./analyses/SourceFinder";
import { SdkGenerator } from "./generates/SdkGenerator";

import { IConfiguration } from "./IConfiguration";
import { IController } from "./structures/IController";
import { IRoute } from "./structures/IRoute";
import { ArrayUtil } from "./utils/ArrayUtil";
import { CompilerOptions } from "./executable/internal/CompilerOptions";

export class NestiaApplication
{
    private readonly config_: IConfiguration;
    private readonly bundle_checker_: Singleton<Promise<(str: string) => boolean>>;

    public constructor(config: IConfiguration)
    {
        this.config_ = config;
        this.bundle_checker_ = new Singleton(async () =>
        {
            const bundles: string[] = await fs.promises.readdir(SdkGenerator.BUNDLE_PATH);
            const tuples: Pair<string, boolean>[] = await ArrayUtil.asyncMap(bundles, async file =>
            {
                const relative: string = path.join(this.config_.output, file);
                const location: string = path.join(SdkGenerator.BUNDLE_PATH, file);
                const stats: fs.Stats = await fs.promises.stat(location);

                return new Pair(relative, stats.isDirectory());
            });

            return (file: string): boolean =>
            {
                for (const it of tuples)
                    if (it.second === false && file === it.first)
                        return true;
                    else if (it.second === true && file.indexOf(it.first) === 0)
                        return true;
                return false;
            };
        });
    }

    public async generate(): Promise<void>
    {
        // MOUNT TS-NODE
        this.prepare();
        
        // LOAD CONTROLLER FILES
        const input: IConfiguration.IInput = this.config_.input instanceof Array
            ? { include: this.config_.input }
            : typeof this.config_.input === "string"
                ? { include: [ this.config_.input ] }
                : this.config_.input;
        const fileList: string[] = await ArrayUtil.asyncFilter
        (
            await SourceFinder.find(input),
            file => this.is_not_excluded(file)
        );

        // ANALYZE REFLECTS
        const unique: WeakSet<any> = new WeakSet();
        const controllerList: IController[] = [];
        
        for (const file of fileList)
            controllerList.push(...await ReflectAnalyzer.analyze(unique, file));

        // ANALYZE TYPESCRIPT CODE
        const program: tsc.Program = tsc.createProgram
        (
            controllerList.map(c => c.file), 
            this.config_.compilerOptions || { noEmit: true }
        );
        const checker: tsc.TypeChecker = program.getTypeChecker();

        const routeList: IRoute[] = [];
        for (const controller of controllerList)
        {
            const sourceFile: tsc.SourceFile | undefined = program.getSourceFile(controller.file);
            if (sourceFile === undefined)
                continue;

            routeList.push(...ControllerAnalyzer.analyze(checker, sourceFile, controller));
        }

        // DO GENERATE
        await SdkGenerator.generate(this.config_, routeList);
    }

    private prepare(): void
    {
        // CONSTRUCT OPTIONS
        const predicator: () => [boolean, boolean] = this.config_.compilerOptions
            ? () => CompilerOptions.emend
                (
                    this.config_.compilerOptions!, 
                    !!this.config_.assert
                )
            : () => 
                {
                    this.config_.compilerOptions = <any>CompilerOptions.DEFAULT_OPTIONS as tsc.CompilerOptions;
                    return [false, false];    
                };

        // MOUNT TS-NODE
        const [transformed, absoluted] = predicator();
        runner.register({
            emit: false,
            compiler: transformed ? "ttypescript" : "typescript",
            compilerOptions: this.config_.compilerOptions,
            require: absoluted 
                ? ["tsconfig-paths/register"] 
                : undefined
        });
    }

    private async is_not_excluded(file: string): Promise<boolean>
    {
        return file.indexOf(path.join(this.config_.output, "functional")) === -1
            && (await this.bundle_checker_.get())(file) === false;
    }
}