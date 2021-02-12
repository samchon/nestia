import * as tsc from "typescript";

import { ControllerAnalyzer } from "./analyses/ControllerAnalyzer";
import { ReflectAnalyzer } from "./analyses/ReflectAnalyzer";
import { SourceFinder } from "./analyses/SourceFinder";
import { SdkGenerator } from "./generates/SdkGenerator";

import { IController } from "./structures/IController";
import { IRoute } from "./structures/IRoute";

export class NestiaApplication
{
    public constructor(readonly inputs: string[], readonly output: string)
    {
    }

    public async sdk(): Promise<void>
    {
        // LOAD CONTROLLER FILES
        const fileList: string[] = [];
        for (const input of this.inputs) 
            fileList.push(...await SourceFinder.find(input));

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
}