import path from "path";
import { SourceFinder } from "../../src/analyses/SourceFinder";

async function main(): Promise<void>
{
    const directories: string[] = await SourceFinder.find
    ({
        include: [path.resolve(`${__dirname}/../exclude/src/controllers/**/*.ts`)],
        exclude: [path.resolve(`${__dirname}/../exclude/src/**/throw_error.ts`)]
    });
    console.log(directories);
}
main().catch(exp =>
{
    console.error(exp);
    process.exit(-1);
});