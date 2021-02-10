import * as tsc from "typescript";

import { IController } from "../structures/IController";
import { IRoute } from "../structures/IRoute";

import { ControllerAnalyzer } from "../analyses/ControllerAnalyzer";
import { ReflectAnalyzer } from "../analyses/ReflectAnalyzer";
import { SourceFinder } from "../analyses/SourceFinder";

import { SdkGenerator } from "../generates/SdkGenerator";

const INPUT_DIR = __dirname + "/controllers";
const OUTPUT_DIR = __dirname + "/../../api";

async function main(): Promise<void>
{
    // LOAD CONTROLLER FILES
    const unique: WeakSet<any> = new WeakSet();
    const fileList: string[] = await SourceFinder.find(INPUT_DIR);

    // ANALYZE REFLECTS
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
    await SdkGenerator.generate(OUTPUT_DIR, routeList);
}
main();