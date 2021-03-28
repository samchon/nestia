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
    public readonly inputs: string[];
    public readonly output: string;

    private readonly bundle_checker_: Singleton<(str: string) => boolean>;

    public constructor(inputs: string[], output: string)
    {
        this.inputs = inputs.map(str => path.resolve(str));
        this.output = path.resolve(output);

        this.bundle_checker_ = new Singleton(async () =>
        {
            const bundles: string[] = await fs.promises.readdir(`${__dirname}${path.sep}bundle`);
            const tuples: Pair<string, boolean>[] = await ArrayUtil.asyncMap(bundles, async file =>
            {
                const relative: string = `${this.output}${path.sep}${file}`;
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

    public async sdk(): Promise<void>
    {
        // LOAD CONTROLLER FILES
        const fileList: string[] = [];
        for (const input of this.inputs)
        {
            const found: string[] = await SourceFinder.find(input);
            const filtered: string[] = await ArrayUtil.asyncFilter(found, file => this.is_not_excluded(file));

            fileList.push(...filtered);
        }

        // ANALYZE REFLECTS
        const unique: WeakSet<any> = new WeakSet();
        const controllerList: IController[] = [];
        
        for (const file of fileList)
            controllerList.push(...await ReflectAnalyzer.analyze(unique, file));

        // ANALYZE TYPESCRIPT CODE
        const program: tsc.Program = tsc.createProgram(controllerList.map(c => c.file), {});
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
        await SdkGenerator.generate(this.output, routeList);
    }

    private async is_not_excluded(file: string): Promise<boolean>
    {
        return file.indexOf(`${this.output}${path.sep}functional`) === -1
            && (await this.bundle_checker_.get())(file) === false;
    }
}
