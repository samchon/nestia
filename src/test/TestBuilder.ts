import * as fs from "fs";
import * as process from "process";

import { NestiaSdkCli } from "../executable/internal/NestiaSdkCli";

export namespace TestBuilder
{
    export async function main
        (
            name: string, 
            argv: string[]
        ): Promise<void>
    {
        console.log(name);
        
        process.chdir(`${PATH}/../../src/test/demonstrations/${name}`);
        if (fs.existsSync("src/api/functional"))
            await fs.promises.rm("src/api/functional", { recursive: true });
        
        try
        {
            await NestiaSdkCli.main(argv, false);
            if (fs.existsSync("src/api/functional/consumers/sales/comments/index.ts") === false)
                throw new Error("Bug on NestiaSdkCli.main(): failed to generate functional files.");
        }
        catch (exp)
        {
            console.log(exp);
            throw exp;
        }
    }

    const PATH = __dirname;
}