import { IController } from "../structures/IController";

import { SourceFinder } from "../utils/SourceFinder";
import { ReflectAnalyzer } from "../analyses/ReflectAnalyzer";
import { TypeAnalyzer } from "../analyses/TypeAnalyzer";
import { IRoute } from "../structures/IRoute";

async function main(): Promise<void>
{
    const unique: WeakSet<any> = new WeakSet();
    const files: string[] = await SourceFinder.find(__dirname + "/controllers");

    const controllerList: IController[] = [];
    for (const file of files)
        controllerList.push(...await ReflectAnalyzer.analyze(unique, file));

    console.log("#" + controllerList.length);
    console.log(JSON.stringify(controllerList, null, 4));

    const routeList: IRoute[] = [];
    for (const controller of controllerList)
        routeList.push(...TypeAnalyzer.analyze(controller));

    console.log("---------------------------------------------------");
    console.log("#" + routeList.length);
    console.log(JSON.stringify(routeList, null, 4));
}
main();