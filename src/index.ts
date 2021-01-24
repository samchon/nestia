import { ControllerParser } from "./utils/ControllerParser";
import { SourceFinder } from "./utils/SourceFinder";

async function main(): Promise<void>
{
    const files: string[] = await SourceFinder.find(__dirname + "/test/controllers");
    for (const file of files)
        await ControllerParser.parse(file);
}
main();