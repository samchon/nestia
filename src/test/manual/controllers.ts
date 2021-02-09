import { IController } from "../../structures/IController";
import { IRoute } from "../../structures/IRoute";

import { ControllerAnalyzer } from "../../analyses/ControllerAnalyzer";
import { ReflectAnalyzer } from "../../analyses/ReflectAnalyzer";
import { SourceFinder } from "../../analyses/SourceFinder";

import { SdkGenerator } from "../../generates/SdkGenerator";

const INPUT_DIR = __dirname + "/../controllers";
const OUTPUT_DIR = __dirname + "/../api";

async function main(): Promise<void>
{
    const unique: WeakSet<any> = new WeakSet();
    const files: string[] = await SourceFinder.find(INPUT_DIR);

    const controllerList: IController[] = [];
    for (const file of files)
        controllerList.push(...await ReflectAnalyzer.analyze(unique, file));

    const routeList: IRoute[] = [];
    for (const controller of controllerList)
        routeList.push(...ControllerAnalyzer.analyze(controller));

    await SdkGenerator.generate(OUTPUT_DIR, routeList);
}
main();