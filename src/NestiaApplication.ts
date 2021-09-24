import * as fs from "fs";
import * as path from "path";
import * as tsc from "typescript";
import { Pair } from "tstl/utility/Pair";
import { Singleton } from "tstl/thread/Singleton";

import { ControllerAnalyzer } from "./analyses/ControllerAnalyzer";
import { ReflectAnalyzer } from "./analyses/ReflectAnalyzer";
import { SourceFinder } from "./analyses/SourceFinder";
import { SdkGenerator } from "./generates/SdkGenerator";

import { IController } from "./structures/IController";
import { IRoute } from "./structures/IRoute";
import { ArrayUtil } from "./utils/ArrayUtil";

export class NestiaApplication
{
    private readonly config_: NestiaApplication.IConfiguration;
    private readonly bundle_checker_: Singleton<Promise<(str: string) => boolean>>;

    public constructor(config: NestiaApplication.IConfiguration)
    {
        this.config_ = config;
        this.bundle_checker_ = new Singleton(async () =>
        {
            const bundles: string[] = await fs.promises.readdir(`${__dirname}${path.sep}bundle`);
            const tuples: Pair<string, boolean>[] = await ArrayUtil.asyncMap(bundles, async file =>
            {
                const relative: string = `${this.config_.output}${path.sep}${file}`;
                const stats: fs.Stats = await fs.promises.stat(`${__dirname}${path.sep}bundle${path.sep}${file}`);

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
        // LOAD CONTROLLER FILES
        const fileList: string[] = [];
        const inputList: string[] = this.config_.input instanceof Array
            ? this.config_.input
            : [this.config_.input];

        for (const file of inputList.map(str => path.resolve(str)))
        {
            const found: string[] = await SourceFinder.find(file);
            const filtered: string[] = await ArrayUtil.asyncFilter(found, file => this.is_not_excluded(file));

            fileList.push(...filtered);
        }

        // ANALYZE REFLECTS
        const unique: WeakSet<any> = new WeakSet();
        const controllerList: IController[] = [];
        
        for (const file of fileList)
            controllerList.push(...await ReflectAnalyzer.analyze(unique, file));

        // ANALYZE TYPESCRIPT CODE
        const program: tsc.Program = tsc.createProgram
        (
            controllerList.map(c => c.file), 
            this.config_.compilerOptions || {}
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
        await SdkGenerator.generate(this.config_.output, routeList);
    }

    private async is_not_excluded(file: string): Promise<boolean>
    {
        return file.indexOf(`${this.config_.output}${path.sep}functional`) === -1
            && (await this.bundle_checker_.get())(file) === false;
    }
}

export namespace NestiaApplication
{
    export interface IConfiguration
    {
        input: string | string[];
        output: string;
        compilerOptions?: tsc.CompilerOptions;
    }
}