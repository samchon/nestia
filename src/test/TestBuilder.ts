import * as fs from "fs";
import * as process from "process";

import { NestiaSdkCli } from "../../src/executable/internal/NestiaSdkCli";

export namespace TestBuilder
{
    export async function main
        (
            name: string, 
            argv: string[]
        ): Promise<void>
    {
        process.chdir(`${PATH}/../${name}`);
        console.log(name);
        
        if (fs.existsSync("src/api/functional"))
            await fs.promises.rmdir("src/api/functional", { recursive: true });
        try
        {
            throw new Error("");
        }
        catch (exp)
        {
            try
            {
                await NestiaSdkCli.main(argv, false);
            }
            catch (exp)
            {
                console.log(exp);
                throw exp;
            }
        }
    }

    const PATH = __dirname;
}